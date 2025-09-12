import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'rpgdb.db');
const sqlPath = path.join(__dirname, 'init-db.sql');

const db = new Database(dbPath);

const sql = fs.readFileSync(sqlPath, 'utf8');

db.exec(sql);

console.log('Database initialized successfully');

db.close();