import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL is missing in .env');
    console.log('Please add DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres to your .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    const sqlPath = path.join(process.cwd(), 'schema.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('❌ schema.sql not found at', sqlPath);
        process.exit(1);
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Applying schema...');
    await client.query(sql);

    console.log('✅ Schema applied successfully!');
    
    // Seed default settings if not exists
    console.log('🌱 Seeding default settings...');
    await client.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES ('SURGE_MULTIPLIER', '1.2', 'Multiplier for last-minute high demand bookings')
      ON CONFLICT (key) DO NOTHING;
    `);
    
    console.log('✅ Default settings seeded.');

  } catch (err) {
    console.error('❌ Error applying schema:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
