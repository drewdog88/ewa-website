const { neon } = require('@neondatabase/serverless');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { validateStripeUrl, sanitizePaymentInstructions } = require('../utils/security-config');

// Database connection
let sql = null;

function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024, // 1MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    const { clubId } = req.params;
    
    if (!clubId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing clubId parameter' 
      });
    }
    
    const sql = getSql();
    
    // GET: Retrieve payment settings for a club
    if (req.method === 'GET') {
      const club = await sql`
        SELECT 
          id, 
          name, 
          zelle_url, 
          stripe_urls,
          payment_instructions,
          is_payment_enabled,
          qr_code_settings
        FROM booster_clubs 
        WHERE id = ${clubId} 
        AND is_active = true
      `;
      
      if (club.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Club not found or inactive' 
        });
      }
      
      const clubData = club[0];
      
      res.status(200).json({
        success: true,
        data: {
          id: clubData.id,
          name: clubData.name,
          zelle_url: clubData.zelle_url,
          stripe_urls: clubData.stripe_urls || {},
          payment_instructions: clubData.payment_instructions,
          is_payment_enabled: clubData.is_payment_enabled,
          qr_code_settings: clubData.qr_code_settings || {}
        }
      });
    }
    
    // PUT: Update payment settings for a club
    else if (req.method === 'PUT') {
      const { 
        is_payment_enabled, 
        zelle_url, 
        stripe_urls, 
        payment_instructions 
      } = req.body;
      
      // Validate input
      if (typeof is_payment_enabled !== 'boolean') {
        return res.status(400).json({ 
          success: false,
          error: 'is_payment_enabled must be a boolean' 
        });
      }
      
      if (zelle_url && typeof zelle_url !== 'string') {
        return res.status(400).json({ 
          success: false,
          error: 'zelle_url must be a string' 
        });
      }
      
      if (stripe_urls && typeof stripe_urls !== 'object') {
        return res.status(400).json({ 
          success: false,
          error: 'stripe_urls must be an object' 
        });
      }
      
      // Validate Stripe URLs if provided
      if (stripe_urls) {
        const stripeUrlFields = ['donation', 'membership', 'fees'];
        for (const field of stripeUrlFields) {
          if (stripe_urls[field]) {
            const validation = validateStripeUrl(stripe_urls[field]);
            if (!validation.valid) {
              return res.status(400).json({
                success: false,
                error: `Invalid Stripe URL for ${field}: ${validation.reason}`
              });
            }
          }
        }
      }
      
      if (payment_instructions && typeof payment_instructions !== 'string') {
        return res.status(400).json({ 
          success: false,
          error: 'payment_instructions must be a string' 
        });
      }
      
      // Sanitize payment instructions if provided
      const sanitizedPaymentInstructions = payment_instructions ? 
        sanitizePaymentInstructions(payment_instructions) : null;
      
      // Update the club's payment settings
      const result = await sql`
        UPDATE booster_clubs 
        SET 
          is_payment_enabled = ${is_payment_enabled},
          zelle_url = ${zelle_url || null},
          stripe_urls = ${stripe_urls ? JSON.stringify(stripe_urls) : null},
          payment_instructions = ${sanitizedPaymentInstructions || null},
          last_payment_update_by = 'admin',
          last_payment_update_at = NOW()
        WHERE id = ${clubId} 
        AND is_active = true
        RETURNING 
          id, 
          name, 
          zelle_url, 
          stripe_urls,
          payment_instructions,
          is_payment_enabled
      `;
      
      if (result.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Club not found or inactive' 
        });
      }
      
      const updatedClub = result[0];
      
      // Log the update in audit trail
      await sql`
        INSERT INTO payment_audit_log (
          booster_club_id, 
          action, 
          before, 
          after, 
          actor
        ) VALUES (
          ${clubId},
          'UPDATE_PAYMENT_SETTINGS',
          '{}',
          ${JSON.stringify({
            is_payment_enabled,
            zelle_url,
            stripe_urls,
            payment_instructions
          })},
          'admin'
        )
      `;
      
      res.status(200).json({
        success: true,
        data: {
          id: updatedClub.id,
          name: updatedClub.name,
          zelle_url: updatedClub.zelle_url,
          stripe_urls: updatedClub.stripe_urls || {},
          payment_instructions: updatedClub.payment_instructions,
          is_payment_enabled: updatedClub.is_payment_enabled
        }
      });
    }
    
    // POST: Upload QR code image
    else if (req.method === 'POST') {
      // Use multer to handle file upload
      upload.single('qrCode')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ 
            success: false,
            error: err.message 
          });
        }
        
        if (!req.file) {
          return res.status(400).json({ 
            success: false,
            error: 'No file uploaded' 
          });
        }
        
        try {
          // Process the image with sharp
          const processedImage = await sharp(req.file.buffer)
            .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
            .png({ compressionLevel: 9 })
            .toBuffer();
          
          // Create directory if it doesn't exist
          const uploadDir = path.join(process.cwd(), 'public', 'zelle-standardized');
          await fs.mkdir(uploadDir, { recursive: true });
          
          // Generate filename
          const filename = `club-${clubId}-qr.png`;
          const filepath = path.join(uploadDir, filename);
          
          // Save the processed image
          await fs.writeFile(filepath, processedImage);
          
          // Update the club's QR code path in database
          const qrCodePath = `/zelle-standardized/${filename}`;
          
          const result = await sql`
            UPDATE booster_clubs 
            SET 
              zelle_qr_code_path = ${qrCodePath},
              last_payment_update_by = 'admin',
              last_payment_update_at = NOW()
            WHERE id = ${clubId} 
            AND is_active = true
            RETURNING id, name
          `;
          
          if (result.length === 0) {
            return res.status(404).json({ 
              success: false,
              error: 'Club not found or inactive' 
            });
          }
          
          // Log the QR code upload in audit trail
          await sql`
            INSERT INTO payment_audit_log (
              booster_club_id, 
              action, 
              before, 
              after, 
              actor
            ) VALUES (
              ${clubId},
              'UPLOAD_QR_CODE',
              '{}',
              ${JSON.stringify({ qr_code_path: qrCodePath })},
              'admin'
            )
          `;
          
          res.status(200).json({
            success: true,
            data: {
              id: result[0].id,
              name: result[0].name,
              qr_code_path: qrCodePath
            }
          });
          
        } catch (error) {
          console.error('QR code upload error:', error);
          res.status(500).json({ 
            success: false,
            error: 'Failed to process and save QR code' 
          });
        }
      });
    }
    
    else {
      return res.status(405).json({ 
        success: false,
        error: 'Method not allowed' 
      });
    }
    
  } catch (error) {
    console.error('Payment settings error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to process payment settings',
      message: 'Please try again later or contact support.'
    });
  }
};

