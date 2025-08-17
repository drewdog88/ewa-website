/**
 * Security Configuration for EWA Payment System
 * Link Redirection Service (No Direct Payment Processing)
 */

const helmet = require('helmet');
const cors = require('cors');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Stripe domain allowlist for payment links
const STRIPE_ALLOWED_DOMAINS = [
  'buy.stripe.com',
  'donate.stripe.com',
  'checkout.stripe.com'
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://*.eastlakewolfpack.org',
      'https://*.vercel.app',
      'https://kre9xoivjggj03of.public.blob.vercel-storage.com',
      'https://d3cmxyafiy0jv5ch.public.blob.vercel-storage.com',
      'http://localhost:3000', // Development only
      'http://localhost:3001'  // Development only
    ];
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern.includes('*')) {
        // Handle wildcard patterns
        const regexPattern = pattern.replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(origin);
      } else {
        return pattern === origin;
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

// Rate limiting configuration
const rateLimiterConfig = {
  // General API rate limiting
  general: {
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 60 * 15 // Block for 15 minutes
  },
  
  // Admin endpoints - stricter limits
  admin: {
    points: 30, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 60 * 30 // Block for 30 minutes
  },
  
  // File upload endpoints - strict for QR codes
  upload: {
    points: 10, // Number of uploads
    duration: 60, // Per 60 seconds
    blockDuration: 60 * 60 // Block for 1 hour
  },
  
  // Payment link endpoints - moderate limits
  payment: {
    points: 50, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 60 * 20 // Block for 20 minutes
  }
};

// Helmet security headers configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://js.stripe.com",
        "https://checkout.stripe.com",
        "https://va.vercel-scripts.com"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://buy.stripe.com",
        "https://donate.stripe.com",
        "https://checkout.stripe.com",
        "https://kre9xoivjggj03of.public.blob.vercel-storage.com",
        "https://d3cmxyafiy0jv5ch.public.blob.vercel-storage.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://buy.stripe.com",
        "https://donate.stripe.com",
        "https://checkout.stripe.com",
        "https://kre9xoivjggj03of.public.blob.vercel-storage.com",
        "https://d3cmxyafiy0jv5ch.public.blob.vercel-storage.com"
      ],
      frameSrc: [
        "https://js.stripe.com",
        "https://checkout.stripe.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
      blockAllMixedContent: []
    }
  },
  crossOriginEmbedderPolicy: false, // Required for Stripe integration
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow Stripe resources
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Allow Stripe popups
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
};

// File upload security configuration (QR codes only)
const uploadConfig = {
  // Multer configuration
  multer: {
    limits: {
      fileSize: 1024 * 1024, // 1MB max
      files: 1, // Only one file at a time
      fields: 5 // Max 5 form fields
    },
    fileFilter: (req, file, cb) => {
      // Only allow image files for QR codes
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  },
  
  // Sharp image processing configuration
  sharp: {
    format: 'png',
    quality: 90,
    compressionLevel: 9,
    stripMetadata: true,
    resize: {
      width: 640,
      height: 640,
      fit: 'inside',
      withoutEnlargement: true
    }
  },
  
  // Allowed file types for QR codes
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ],
  
  // Maximum file size in bytes
  maxFileSize: 1024 * 1024, // 1MB
};

// URL validation configuration
const urlValidationConfig = {
  // Stripe URL patterns
  stripePatterns: [
    /^https:\/\/buy\.stripe\.com\/[a-zA-Z0-9_-]+$/,
    /^https:\/\/donate\.stripe\.com\/[a-zA-Z0-9_-]+$/,
    /^https:\/\/checkout\.stripe\.com\/[a-zA-Z0-9_-]+$/
  ],
  
  // Forbidden URL schemes
  forbiddenSchemes: [
    'javascript:',
    'data:',
    'file:',
    'ftp:',
    'mailto:',
    'tel:'
  ],
  
  // Required URL properties
  required: {
    protocol: 'https:',
    hostname: STRIPE_ALLOWED_DOMAINS
  }
};

// Input sanitization configuration
const sanitizationConfig = {
  // HTML sanitization for payment instructions
  html: {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel']
    },
    allowedSchemes: ['https', 'mailto'],
    allowedSchemesByTag: {
      'a': ['https', 'mailto']
    }
  },
  
  // Text sanitization
  text: {
    maxLength: 1000,
    allowedCharacters: /[a-zA-Z0-9\s\-_.,!?@#$%&*()+=:;'"<>\/\\]/g
  }
};

// Logging configuration
const loggingConfig = {
  // Fields to redact from logs (no payment data to redact)
  redactFields: [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie'
  ],
  
  // URL parameters to redact
  redactUrlParams: [
    'token',
    'key',
    'secret',
    'password'
  ],
  
  // Request headers to redact
  redactHeaders: [
    'authorization',
    'cookie',
    'x-api-key'
  ]
};

// Create rate limiters
const createRateLimiters = () => {
  return {
    general: new RateLimiterMemory(rateLimiterConfig.general),
    admin: new RateLimiterMemory(rateLimiterConfig.admin),
    upload: new RateLimiterMemory(rateLimiterConfig.upload),
    payment: new RateLimiterMemory(rateLimiterConfig.payment)
  };
};

// Validate Stripe URL
const validateStripeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (urlObj.protocol !== 'https:') {
      return { valid: false, reason: 'Protocol must be HTTPS' };
    }
    
    // Check hostname
    if (!STRIPE_ALLOWED_DOMAINS.includes(urlObj.hostname)) {
      return { valid: false, reason: 'Invalid Stripe domain' };
    }
    
    // Check for forbidden schemes
    for (const scheme of urlValidationConfig.forbiddenSchemes) {
      if (url.includes(scheme)) {
        return { valid: false, reason: 'Forbidden URL scheme detected' };
      }
    }
    
    // Check pattern
    const isValidPattern = urlValidationConfig.stripePatterns.some(pattern => 
      pattern.test(url)
    );
    
    if (!isValidPattern) {
      return { valid: false, reason: 'Invalid Stripe URL pattern' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Invalid URL format' };
  }
};

// Sanitize payment instructions
const sanitizePaymentInstructions = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove any HTML tags
  const cleanText = text.replace(/<[^>]*>/g, '');
  
  // Limit length
  if (cleanText.length > sanitizationConfig.text.maxLength) {
    return cleanText.substring(0, sanitizationConfig.text.maxLength);
  }
  
  // Remove any potentially dangerous characters
  return cleanText.replace(/[^\w\s\-_.,!?@#$%&*()+=:;'"<>\/\\]/g, '');
};

// Generate secure filename for QR codes
const generateSecureFilename = (originalName, clubSlug) => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = '.png'; // Always PNG for QR codes
  
  return `${clubSlug}-${timestamp}-${randomSuffix}${extension}`;
};

// Export configurations
module.exports = {
  corsOptions,
  rateLimiterConfig,
  helmetConfig,
  uploadConfig,
  urlValidationConfig,
  sanitizationConfig,
  loggingConfig,
  STRIPE_ALLOWED_DOMAINS,
  createRateLimiters,
  validateStripeUrl,
  sanitizePaymentInstructions,
  generateSecureFilename
};
