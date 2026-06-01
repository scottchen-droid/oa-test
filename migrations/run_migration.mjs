import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Client } = pg;

const client = new Client({
  host: '35.229.147.245',
  port: 5432,
  database: 'oa',
  user: 'postgres',
  password: 'ogO8AcRLsC3O@',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const sql = readFileSync(join(__dirname, '001_initial_schema.sql'), 'utf8');

async function run() {
  console.log('Connecting to Cloud SQL...');
  await client.connect();
  console.log('Connected. Running migration...\n');

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration completed successfully.');

    // Report created tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log(`\nTables in database (${result.rows.length} total):`);
    result.rows.forEach(r => console.log('  -', r.table_name));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nMigration FAILED — rolled back.');
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
