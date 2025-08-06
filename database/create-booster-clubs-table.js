require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

// Database connection configuration
let sql = null;

// Initialize the Neon connection
function getSql() {
    if (!sql) {
        if (!process.env.DATABASE_URL) {
            console.warn('⚠️ DATABASE_URL not found');
            return null;
        }
        sql = neon(process.env.DATABASE_URL);
        console.log('✅ Connected to Neon PostgreSQL database');
    }
    return sql;
}

async function createBoosterClubsTable() {
    console.log('🔄 Starting Phase 1 Database Migration: Booster Clubs Table');
    
    const sql = getSql();
    if (!sql) {
        console.error('❌ Database connection not available');
        return;
    }
    
    try {
        console.log('✅ Connected to Neon PostgreSQL database');
        
        // Step 1: Enable UUID extension and create booster_clubs table
        console.log('📋 Enabling UUID extension...');
        await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
        console.log('✅ UUID extension enabled');
        
        console.log('📋 Creating booster_clubs table...');
        await sql`
            CREATE TABLE IF NOT EXISTS booster_clubs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                website_url VARCHAR(500),
                donation_url VARCHAR(500),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ booster_clubs table created');
        
        // Step 2: Insert the 22 booster clubs from index.html
        console.log('📝 Inserting booster club data...');
        const clubs = [
            { name: 'EHS Band Boosters', description: 'The EHS Band Boosters is dedicated to supporting the Eastlake High School band program.', website_url: 'https://ehsbandboosters.org', donation_url: 'payment.html?club=EHS%20Band%20Boosters' },
            { name: 'Eastlake Baseball Club', description: 'The Eastlake Baseball Club supports the Eastlake High School baseball teams.', website_url: 'https://eastlakebaseball.org', donation_url: 'payment.html?club=Eastlake%20Baseball%20Club' },
            { name: 'Eastlake Boys Basketball Booster Club', description: 'The Eastlake Boys Basketball Booster Club is dedicated to supporting the boys\' basketball program at Eastlake High School.', website_url: 'https://eastlakeboysbasketball.org', donation_url: 'payment.html?club=Eastlake%20Boys%20Basketball%20Booster%20Club' },
            { name: 'Eastlake Girls Basketball Booster Club', description: 'The Eastlake Girls Basketball Booster Club is dedicated to supporting the girls\' basketball program at Eastlake High School.', website_url: 'https://eastlakegirlsbasketball.org', donation_url: 'payment.html?club=Eastlake%20Girls%20Basketball%20Booster%20Club' },
            { name: 'Eastlake Cheer Booster Club', description: 'The Eastlake Cheer Booster Club supports the cheerleading teams at Eastlake High School.', website_url: 'https://eastlakecheer.org', donation_url: 'payment.html?club=Eastlake%20Cheer%20Booster%20Club' },
            { name: 'Eastlake Choir', description: 'The Eastlake Choir Booster Club is committed to supporting the choir program at Eastlake High School.', website_url: 'https://eastlakechoir.org', donation_url: 'payment.html?club=Eastlake%20Choir' },
            { name: 'Eastlake Cross-Country Boosters', description: 'The Eastlake Cross-Country Boosters support the cross-country teams at Eastlake High School.', website_url: 'https://eastlakecrosscountry.org', donation_url: 'payment.html?club=Eastlake%20Cross-Country%20Boosters' },
            { name: 'Eastlake Drama', description: 'The Eastlake Drama Booster Club supports the drama and theater program at Eastlake High School.', website_url: 'https://eastlakedrama.org', donation_url: 'payment.html?club=Eastlake%20Drama' },
            { name: 'Eastlake Fastpitch (Girls)', description: 'The Eastlake Fastpitch Booster Club supports the girls\' fastpitch softball program at Eastlake High School.', website_url: 'https://eastlakefastpitch.org', donation_url: 'payment.html?club=Eastlake%20Fastpitch%20(Girls)' },
            { name: 'Eastlake Football Booster Club', description: 'The Eastlake Football Booster Club supports the football program at Eastlake High School.', website_url: 'https://eastlakefootball.org', donation_url: 'payment.html?club=Eastlake%20Football%20Booster%20Club' },
            { name: 'Eastlake Girls Lacrosse Booster Club', description: 'The Eastlake Girls Lacrosse Booster Club supports the girls\' lacrosse program at Eastlake High School.', website_url: 'https://eastlakegirlslacrosse.org', donation_url: 'payment.html?club=Eastlake%20Girls%20Lacrosse%20Booster%20Club' },
            { name: 'Eastlake Boys Lacrosse Booster Club', description: 'The Eastlake Boys Lacrosse Booster Club supports the boys\' lacrosse program at Eastlake High School.', website_url: 'https://eastlakeboyslacrosse.org', donation_url: 'payment.html?club=Eastlake%20Boys%20Lacrosse%20Booster%20Club' },
            { name: 'Eastlake Orchestra Booster Club', description: 'The Eastlake Orchestra Booster Club supports the orchestra program at Eastlake High School.', website_url: 'https://eastlakeorchestra.org', donation_url: 'payment.html?club=Eastlake%20Orchestra%20Booster%20Club' },
            { name: 'Eastlake Girls Soccer Booster Club', description: 'The Eastlake Girls Soccer Booster Club supports the girls\' soccer program at Eastlake High School.', website_url: 'https://eastlakegirlssoccer.org', donation_url: 'payment.html?club=Eastlake%20Girls%20Soccer%20Booster%20Club' },
            { name: 'Eastlake Boys Soccer Booster Club', description: 'The Eastlake Boys Soccer Booster Club supports the boys\' soccer program at Eastlake High School.', website_url: 'https://eastlakeboyssoccer.org', donation_url: 'payment.html?club=Eastlake%20Boys%20Soccer%20Booster%20Club' },
            { name: 'Eastlake Girls Swimming Booster Club', description: 'The Eastlake Girls Swimming Booster Club supports the girls\' swimming program at Eastlake High School.', website_url: 'https://eastlakegirlsswimming.org', donation_url: 'payment.html?club=Eastlake%20Girls%20Swimming%20Booster%20Club' },
            { name: 'Eastlake Boys Swimming Booster Club', description: 'The Eastlake Boys Swimming Booster Club supports the boys\' swimming program at Eastlake High School.', website_url: 'https://eastlakeboyss swimming.org', donation_url: 'payment.html?club=Eastlake%20Boys%20Swimming%20Booster%20Club' },
            { name: 'Eastlake Girls Tennis Booster Club', description: 'The Eastlake Girls Tennis Booster Club supports the girls\' tennis program at Eastlake High School.', website_url: 'https://eastlakegirlstennis.org', donation_url: 'payment.html?club=Eastlake%20Girls%20Tennis%20Booster%20Club' },
            { name: 'Eastlake Boys Tennis Booster Club', description: 'The Eastlake Boys Tennis Booster Club supports the boys\' tennis program at Eastlake High School.', website_url: 'https://eastlakeboystennis.org', donation_url: 'payment.html?club=Eastlake%20Boys%20Tennis%20Booster%20Club' },
            { name: 'Eastlake Track & Field Booster Club', description: 'The Eastlake Track & Field Booster Club supports the track and field program at Eastlake High School.', website_url: 'https://eastlaketrack.org', donation_url: 'payment.html?club=Eastlake%20Track%20%26%20Field%20Booster%20Club' },
            { name: 'Eastlake Volleyball Booster Club', description: 'The Eastlake Volleyball Booster Club supports the volleyball program at Eastlake High School.', website_url: 'https://eastlakevolleyball.org', donation_url: 'payment.html?club=Eastlake%20Volleyball%20Booster%20Club' },
            { name: 'Eastlake Wrestling Booster Club', description: 'The Eastlake Wrestling Booster Club supports the wrestling program at Eastlake High School.', website_url: 'https://eastlakewrestling.org', donation_url: 'payment.html?club=Eastlake%20Wrestling%20Booster%20Club' }
        ];
        
        for (const club of clubs) {
            await sql`
                INSERT INTO booster_clubs (name, description, website_url, donation_url)
                VALUES (${club.name}, ${club.description}, ${club.website_url}, ${club.donation_url})
                ON CONFLICT (name) DO NOTHING
            `;
        }
        console.log('✅ Booster club data inserted');
        
        // Step 3: Add club_id columns to existing tables
        console.log('🔗 Adding foreign key relationships...');
        
        // Add club_id to officers table
        await sql`ALTER TABLE officers ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES booster_clubs(id)`;
        console.log('✅ Added club_id to officers table');
        
        // Add club_id to volunteers table
        await sql`ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES booster_clubs(id)`;
        console.log('✅ Added club_id to volunteers table');
        
        // Add club_id to users table
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES booster_clubs(id)`;
        console.log('✅ Added club_id to users table');
        
        // Add club_id to form_1099 table
        await sql`ALTER TABLE form_1099 ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES booster_clubs(id)`;
        console.log('✅ Added club_id to form_1099 table');
        
        // Add club_id to documents table
        await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES booster_clubs(id)`;
        console.log('✅ Added club_id to documents table');
        
        // Add club_id to insurance_forms table
        await sql`ALTER TABLE insurance_forms ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES booster_clubs(id)`;
        console.log('✅ Added club_id to insurance_forms table');
        
        // Step 4: Create indexes for better performance
        console.log('📊 Creating indexes...');
        await sql`CREATE INDEX IF NOT EXISTS idx_booster_clubs_name ON booster_clubs(name)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_booster_clubs_active ON booster_clubs(is_active)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_officers_club_id ON officers(club_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_volunteers_club_id ON volunteers(club_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_users_club_id ON users(club_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_1099_club_id ON form_1099(club_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_documents_club_id ON documents(club_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_insurance_club_id ON insurance_forms(club_id)`;
        console.log('✅ Indexes created');
        
        // Step 5: Verify the migration
        console.log('🔍 Verifying migration...');
        const clubCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
        console.log(`✅ Found ${clubCount[0].count} booster clubs`);
        
        const tableInfo = await sql`
            SELECT 
                table_name,
                column_name,
                data_type
            FROM information_schema.columns 
            WHERE table_name IN ('booster_clubs', 'officers', 'volunteers', 'users', 'form_1099', 'documents', 'insurance_forms')
            AND column_name = 'club_id'
            ORDER BY table_name
        `;
        
        console.log('✅ Foreign key columns verified:');
        tableInfo.forEach(row => {
            console.log(`   - ${row.table_name}.${row.column_name} (${row.data_type})`);
        });
        
        console.log('🎉 Phase 1 Migration completed successfully!');
        console.log('📝 Next steps:');
        console.log('   1. Test all existing functionality');
        console.log('   2. Update application code to use new club_id relationships');
        console.log('   3. Migrate existing string-based club data to use club_id');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    createBoosterClubsTable()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createBoosterClubsTable }; 