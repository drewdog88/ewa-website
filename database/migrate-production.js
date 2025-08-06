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

async function migrateProduction() {
    console.log('🚀 Starting Production Database Migration');
    console.log('⚠️ This will run against the PRODUCTION database!');
    
    const sql = getSql();
    if (!sql) {
        console.error('❌ Database connection not available');
        return;
    }
    
    try {
        console.log('✅ Connected to production Neon PostgreSQL database');
        
        // Step 1: Verify booster_clubs table exists
        console.log('\n📋 Step 1: Verifying booster_clubs table...');
        const tableExists = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'booster_clubs'
            ) as exists
        `;
        
        if (tableExists[0].exists) {
            console.log('✅ booster_clubs table already exists in production');
        } else {
            console.log('❌ booster_clubs table does not exist in production');
            console.log('🔄 Creating booster_clubs table...');
            
            // Enable UUID extension
            await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
            
            // Create booster_clubs table
            await sql`
                CREATE TABLE booster_clubs (
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
            
            // Insert the 22 booster clubs
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
            console.log('✅ Booster club data inserted into production');
        }
        
        // Step 2: Verify and add club_id columns
        console.log('\n🔗 Step 2: Verifying foreign key columns...');
        const tables = ['officers', 'volunteers', 'users', 'form_1099', 'documents', 'insurance_forms'];
        
        for (const table of tables) {
            const hasClubId = await sql`
                SELECT COUNT(*) as count 
                FROM information_schema.columns 
                WHERE table_name = ${table} AND column_name = 'club_id'
            `;
            
            if (hasClubId[0].count === 0) {
                console.log(`🔄 Adding club_id to ${table} table...`);
                await sql`ALTER TABLE ${sql(table)} ADD COLUMN club_id UUID REFERENCES booster_clubs(id)`;
                console.log(`✅ Added club_id to ${table} table`);
            } else {
                console.log(`✅ ${table} table already has club_id column`);
            }
        }
        
        // Step 3: Verify and create indexes
        console.log('\n📊 Step 3: Verifying indexes...');
        const indexes = [
            { name: 'idx_booster_clubs_name', table: 'booster_clubs', column: 'name' },
            { name: 'idx_booster_clubs_active', table: 'booster_clubs', column: 'is_active' },
            { name: 'idx_officers_club_id', table: 'officers', column: 'club_id' },
            { name: 'idx_volunteers_club_id', table: 'volunteers', column: 'club_id' },
            { name: 'idx_users_club_id', table: 'users', column: 'club_id' },
            { name: 'idx_1099_club_id', table: 'form_1099', column: 'club_id' },
            { name: 'idx_documents_club_id', table: 'documents', column: 'club_id' },
            { name: 'idx_insurance_club_id', table: 'insurance_forms', column: 'club_id' }
        ];
        
        for (const index of indexes) {
            const indexExists = await sql`
                SELECT COUNT(*) as count 
                FROM pg_indexes 
                WHERE indexname = ${index.name}
            `;
            
            if (indexExists[0].count === 0) {
                console.log(`🔄 Creating index ${index.name}...`);
                await sql`CREATE INDEX ${sql(index.name)} ON ${sql(index.table)}(${sql(index.column)})`;
                console.log(`✅ Created index ${index.name}`);
            } else {
                console.log(`✅ Index ${index.name} already exists`);
            }
        }
        
        // Step 4: Verify production data
        console.log('\n🔍 Step 4: Verifying production data...');
        const clubCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
        console.log(`✅ Production has ${clubCount[0].count} booster clubs`);
        
        const officerCount = await sql`SELECT COUNT(*) as count FROM officers`;
        console.log(`✅ Production has ${officerCount[0].count} officers`);
        
        const userCount = await sql`SELECT COUNT(*) as count FROM users`;
        console.log(`✅ Production has ${userCount[0].count} users`);
        
        const form1099Count = await sql`SELECT COUNT(*) as count FROM form_1099`;
        console.log(`✅ Production has ${form1099Count[0].count} 1099 forms`);
        
        // Step 5: Test production queries
        console.log('\n🧪 Step 5: Testing production queries...');
        
        const testQuery = await sql`
            SELECT o.name, o.position, bc.name as club_name 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            LIMIT 3
        `;
        console.log(`✅ Production join query successful: ${testQuery.length} results`);
        
        console.log('\n🎉 Production migration completed successfully!');
        console.log('📝 Production database is ready for the new normalized structure.');
        
        return true;
        
    } catch (error) {
        console.error('❌ Production migration failed:', error);
        throw error;
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    migrateProduction()
        .then(() => {
            console.log('✅ Production migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Production migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateProduction }; 