const { neon } = require('@neondatabase/serverless');

// Database connection configuration
let sql = null;

// Initialize the Neon connection
function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not found, using in-memory storage');
      return null;
    }
    sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
  }
  return sql;
}

// Officers functions
async function getOfficers() {
  const sql = getSql();
  if (!sql) return [];
    
  try {
    const officers = await sql`
                    SELECT o.id, o.name, o.position, o.email, o.phone, o.club_id, o.created_at, o.updated_at, bc.name as boosterclubname 
                    FROM officers o 
                    LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
                    ORDER BY o.created_at
                `;
    return officers;
  } catch (error) {
    console.error('❌ Database error getting officers:', {
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    return [];
  }
}

async function addOfficer(officer) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    // Get the club_id for the selected booster club
    let club_id = null;
    if (officer.booster_club) {
      const clubResult = await sql`SELECT id FROM booster_clubs WHERE name = ${officer.booster_club}`;
      if (clubResult.length > 0) {
        club_id = clubResult[0].id;
      }
    }
        
    const result = await sql`
            INSERT INTO officers (name, position, email, phone, club_id)
            VALUES (${officer.name}, ${officer.position}, ${officer.email}, ${officer.phone}, ${club_id})
            RETURNING *
        `;
    return result[0];
  } catch (error) {
    console.error('❌ Database error adding officer:', {
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      officer: { name: officer.name, position: officer.position }
    });
    throw error;
  }
}

// Users functions
async function getUsers() {
  const sql = getSql();
  if (!sql) return {};
    
  try {
    const users = await sql`SELECT * FROM users ORDER BY created_at`;
    const userMap = {};
    users.forEach(user => {
      userMap[user.username] = user;
    });
    return userMap;
  } catch (error) {
    console.error('Error getting users:', error);
    return {};
  }
}

async function updateUser(username, updates) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    const result = await sql`
            UPDATE users 
            SET last_login = ${updates.lastLogin || null},
                is_first_login = ${updates.isFirstLogin !== undefined ? updates.isFirstLogin : null}
            WHERE username = ${username}
            RETURNING *
        `;
    return result[0];
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Volunteers functions
async function getVolunteers() {
  const sql = getSql();
  if (!sql) return [];
    
  try {
    const volunteers = await sql`SELECT * FROM volunteers ORDER BY created_at`;
    return volunteers;
  } catch (error) {
    console.error('Error getting volunteers:', error);
    return [];
  }
}

async function addVolunteer(volunteer) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    const result = await sql`
            INSERT INTO volunteers (name, email, phone, club, club_name, interests, availability)
            VALUES (${volunteer.volunteerName}, ${volunteer.email}, ${volunteer.phone}, ${volunteer.boosterClub}, ${volunteer.boosterClub}, ${volunteer.childName || ''}, ${volunteer.message || ''})
            RETURNING *
        `;
    return result[0];
  } catch (error) {
    console.error('Error adding volunteer:', error);
    throw error;
  }
}

async function updateVolunteer(volunteerId, updates) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    // Only allow updating specific fields for security
    const allowedFields = ['status', 'notes', 'assigned_club_id'];
    const updateFields = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields[field] = updates[field];
      }
    }
    
    if (Object.keys(updateFields).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Build dynamic update query based on provided fields
    let updateQuery = 'UPDATE volunteers SET updated_at = CURRENT_TIMESTAMP';
    const params = [volunteerId];
    let paramIndex = 2;
    
    if (updateFields.status !== undefined) {
      updateQuery += `, status = $${paramIndex++}`;
      params.push(updateFields.status);
    }
    if (updateFields.notes !== undefined) {
      updateQuery += `, notes = $${paramIndex++}`;
      params.push(updateFields.notes);
    }
    if (updateFields.assigned_club_id !== undefined) {
      updateQuery += `, assigned_club_id = $${paramIndex++}`;
      params.push(updateFields.assigned_club_id);
    }
    
    updateQuery += ` WHERE id = $1 RETURNING *`;
    
    const result = await sql.unsafe(updateQuery, params);
    
    if (result.length === 0) {
      return null; // Volunteer not found
    }
    
    return result[0];
  } catch (error) {
    console.error('Error updating volunteer:', error);
    throw error;
  }
}

// Insurance forms functions
async function getInsurance() {
  const sql = getSql();
  if (!sql) return [];
    
  try {
    const forms = await sql`SELECT * FROM insurance_forms ORDER BY created_at`;
    return forms;
  } catch (error) {
    console.error('Error getting insurance forms:', error);
    return [];
  }
}

async function addInsurance(form) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    const result = await sql`
            INSERT INTO insurance_forms (event_name, event_date, event_description, participant_count, submitted_by, status)
            VALUES (${form.eventName}, ${form.eventDate}, ${form.eventDescription}, ${form.participantCount}, ${form.submittedBy}, ${form.status})
            RETURNING *
        `;
    return result[0];
  } catch (error) {
    console.error('Error adding insurance form:', error);
    throw error;
  }
}

// 1099 forms functions
async function getForm1099() {
  const sql = getSql();
  if (!sql) return [];
    
  try {
    const forms = await sql`SELECT * FROM form_1099 ORDER BY created_at`;
    return forms;
  } catch (error) {
    console.error('Error getting 1099 forms:', error);
    return [];
  }
}

async function addForm1099(form) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    const result = await sql`
            INSERT INTO form_1099 (recipient_name, recipient_tin, amount, description, submitted_by, tax_year, status, w9_filename, w9_blob_url, w9_file_size, w9_mime_type, booster_club)
            VALUES (${form.recipientName}, ${form.recipientTin}, ${form.amount}, ${form.description}, ${form.submittedBy}, ${form.taxYear}, ${form.status}, ${form.w9Filename || null}, ${form.w9BlobUrl || null}, ${form.w9FileSize || null}, ${form.w9MimeType || null}, ${form.boosterClub || null})
            RETURNING *
        `;
    return result[0];
  } catch (error) {
    console.error('Error adding 1099 form:', error);
    throw error;
  }
}

async function updateForm1099Status(formId, status) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    const result = await sql`
            UPDATE form_1099 
            SET status = ${status}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${formId}
            RETURNING *
        `;
    return result[0];
  } catch (error) {
    console.error('Error updating 1099 form status:', error);
    throw error;
  }
}

async function updateForm1099(formId, updates) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    const result = await sql`
            UPDATE form_1099 
            SET 
                recipient_name = ${updates.recipientName},
                recipient_tin = ${updates.recipientTin},
                amount = ${updates.amount},
                description = ${updates.description || ''},
                tax_year = ${updates.taxYear},
                booster_club = ${updates.boosterClub || null},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${formId}
            RETURNING *
        `;
    return result[0];
  } catch (error) {
    console.error('Error updating 1099 form:', error);
    throw error;
  }
}

async function deleteForm1099(formId) {
  const sql = getSql();
  if (!sql) return false;
    
  try {
    const result = await sql`DELETE FROM form_1099 WHERE id = ${formId} RETURNING *`;
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting 1099 form:', error);
    throw error;
  }
}

// Documents functions
async function getDocuments(boosterClub = null) {
  const sql = getSql();
  if (!sql) return [];
    
  try {
    let documents;
    if (boosterClub) {
      documents = await sql`SELECT * FROM documents WHERE booster_club = ${boosterClub} ORDER BY created_at`;
    } else {
      documents = await sql`SELECT * FROM documents ORDER BY created_at`;
    }
    return documents;
  } catch (error) {
    console.error('Error getting documents:', error);
    return [];
  }
}

async function addDocument(document) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    const result = await sql`
            INSERT INTO documents (filename, original_name, blob_url, file_size, mime_type, booster_club, uploaded_by)
            VALUES (${document.filename}, ${document.originalName}, ${document.blobUrl}, ${document.fileSize}, ${document.mimeType}, ${document.boosterClub}, ${document.uploadedBy})
            RETURNING *
        `;
    return result[0];
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
}

async function deleteDocument(documentId) {
  const sql = getSql();
  if (!sql) return false;
    
  try {
    const result = await sql`DELETE FROM documents WHERE id = ${documentId} RETURNING *`;
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

// News functions
async function getNews() {
  const sql = getSql();
  if (!sql) return [];
    
  try {
    const news = await sql`SELECT * FROM news ORDER BY created_at DESC`;
    return news;
  } catch (error) {
    console.error('Error getting news:', error);
    return [];
  }
}

async function getPublishedNews() {
  const sql = getSql();
  if (!sql) return [];
    
  try {
    const news = await sql`SELECT * FROM news WHERE status = 'published' ORDER BY published_at DESC`;
    return news;
  } catch (error) {
    console.error('Error getting published news:', error);
    return [];
  }
}

async function addNews(newsItem) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    // Generate slug from title
    const slug = newsItem.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const result = await sql`
            INSERT INTO news (title, content, slug, status, created_by)
            VALUES (${newsItem.title}, ${newsItem.content}, ${slug}, ${newsItem.status || 'draft'}, ${newsItem.createdBy})
            RETURNING *
        `;
    return result[0];
  } catch (error) {
    console.error('Error adding news:', error);
    throw error;
  }
}

async function updateNews(newsId, updates) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    console.log('🔍 updateNews called with:', { newsId, updates });
    
    // Only allow updating specific fields
    const allowedFields = ['title', 'content', 'status'];
    const updateFields = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields[field] = updates[field];
      }
    }
    
    if (Object.keys(updateFields).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    console.log('🔍 Update fields:', updateFields);
    
    // Build dynamic update query using sql.unsafe() like the working test script
    let updateQuery = 'UPDATE news SET updated_at = CURRENT_TIMESTAMP';
    const params = [newsId];
    let paramIndex = 2;
    
    if (updateFields.title !== undefined) {
      updateQuery += `, title = $${paramIndex++}`;
      params.push(updateFields.title);
    }
    if (updateFields.content !== undefined) {
      updateQuery += `, content = $${paramIndex++}`;
      params.push(updateFields.content);
    }
    if (updateFields.status !== undefined) {
      updateQuery += `, status = $${paramIndex++}`;
      params.push(updateFields.status);
    }
    
    updateQuery += ` WHERE id = $1 RETURNING *`;
    
    console.log('🔍 SQL Query:', updateQuery);
    console.log('🔍 Parameters:', params);
    
    const result = await sql.unsafe(updateQuery, params);
    
    console.log('🔍 Query result:', result);
    
    if (result.length === 0) {
      console.log('❌ News article not found in database');
      return null; // News not found
    }
    
    console.log('✅ News article updated successfully');
    return result[0];
  } catch (error) {
    console.error('❌ Error updating news:', error);
    throw error;
  }
}

async function publishNews(newsId) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    const result = await sql`
            UPDATE news 
            SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${newsId}
            RETURNING *
        `;
    
    if (result.length === 0) {
      return null; // News not found
    }
    
    return result[0];
  } catch (error) {
    console.error('Error publishing news:', error);
    throw error;
  }
}

async function deleteNews(newsId) {
  const sql = getSql();
  if (!sql) return false;
    
  try {
    const result = await sql`DELETE FROM news WHERE id = ${newsId} RETURNING *`;
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting news:', error);
    throw error;
  }
}

// Links functions
async function getLinks() {
  const sql = getSql();
  if (!sql) return [];
    
  try {
    const links = await sql`SELECT * FROM links WHERE is_visible = true ORDER BY order_index, created_at`;
    return links;
  } catch (error) {
    console.error('Error getting links:', error);
    return [];
  }
}

async function getAllLinks() {
  const sql = getSql();
  if (!sql) return [];
    
  try {
    const links = await sql`SELECT * FROM links ORDER BY order_index, created_at`;
    return links;
  } catch (error) {
    console.error('Error getting all links:', error);
    return [];
  }
}

async function addLink(link) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    const result = await sql`
            INSERT INTO links (title, url, category, order_index, is_visible, created_by)
            VALUES (${link.title}, ${link.url}, ${link.category}, ${link.orderIndex || 0}, ${link.isVisible !== false}, ${link.createdBy})
            RETURNING *
        `;
    return result[0];
  } catch (error) {
    console.error('Error adding link:', error);
    throw error;
  }
}

async function updateLink(linkId, updates) {
  const sql = getSql();
  if (!sql) return null;
    
  try {
    // Only allow updating specific fields
    const allowedFields = ['title', 'url', 'category', 'order_index', 'is_visible'];
    const updateFields = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields[field] = updates[field];
      }
    }
    
    if (Object.keys(updateFields).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Build dynamic update query
    const setClauses = Object.keys(updateFields).map((field, index) => `${field} = $${index + 2}`);
    const values = Object.values(updateFields);
    
    const result = await sql.unsafe(`
            UPDATE links 
            SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [linkId, ...values]);
    
    if (result.length === 0) {
      return null; // Link not found
    }
    
    return result[0];
  } catch (error) {
    console.error('Error updating link:', error);
    throw error;
  }
}

async function deleteLink(linkId) {
  const sql = getSql();
  if (!sql) return false;
    
  try {
    const result = await sql`DELETE FROM links WHERE id = ${linkId} RETURNING *`;
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting link:', error);
    throw error;
  }
}

async function incrementLinkClicks(linkId) {
  const sql = getSql();
  if (!sql) return false;
    
  try {
    await sql`UPDATE links SET click_count = click_count + 1 WHERE id = ${linkId}`;
    return true;
  } catch (error) {
    console.error('Error incrementing link clicks:', error);
    return false;
  }
}

// Database initialization
async function initializeDatabase() {
  const sql = getSql();
  if (!sql) {
    throw new Error('Database connection not available');
  }
    
  try {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
        
    // Split the schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim());
        
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
        
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
    throw error;
  }
}

// Data migration
async function migrateDataFromJson() {
  try {
    const fs = require('fs');
    const path = require('path');
        
    // Check if officers table is empty
    const officers = await getOfficers();
        
    if (officers.length === 0) {
      // Migrate officers from JSON
      const officersPath = path.join(__dirname, '..', 'data', 'officers.json');
      if (fs.existsSync(officersPath)) {
        const officersData = fs.readFileSync(officersPath, 'utf8');
        const officersList = JSON.parse(officersData);
                
        for (const officer of officersList) {
          await addOfficer(officer);
        }
        console.log(`✅ Migrated ${officersList.length} officers to database`);
      }
    }
        
    console.log('✅ Data migration completed');
  } catch (error) {
    console.error('❌ Error migrating data:', error);
    throw error;
  }
}

module.exports = {
  getSql,
  getOfficers,
  addOfficer,
  getUsers,
  updateUser,
  getVolunteers,
  addVolunteer,
  updateVolunteer,
  getInsurance,
  addInsurance,
  getForm1099,
  addForm1099,
  updateForm1099Status,
  updateForm1099,
  deleteForm1099,
  getDocuments,
  addDocument,
  deleteDocument,
  getNews,
  getPublishedNews,
  addNews,
  updateNews,
  publishNews,
  deleteNews,
  getLinks,
  getAllLinks,
  addLink,
  updateLink,
  deleteLink,
  incrementLinkClicks,
  initializeDatabase,
  migrateDataFromJson
}; 