// Procedure Loader for Freelance Marketplace
// Loads PL/SQL-style stored procedures from db/procedures.sql
// Usage: node load_procedures.js

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const pool = require('./db');

// Load stored procedures from schema file
(async () => {
  try {
    const procPath = path.join(__dirname, '../db/procedures.sql');
    const sql = fs.readFileSync(procPath, 'utf-8');

    // Split into individual statements
    const statements = sql.split(';')
                  .filter(line => line.trim().length > 0)
                  .map(line => line.trim());

    // Execute each statement in the pool
    for (const stmt of statements) {
      if (stmt.length > 0) {
        await pool.query(stmt);
      }
    }

    console.log('[PROCEDURE LOADER] All stored procedures loaded successfully.');
  } catch (err) {
    console.error('[PROCEDURE LOADER] Error:', err.message);
    process.exit(1);
  }
})();
