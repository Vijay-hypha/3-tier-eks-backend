const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

const app = express();
app.use(bodyParser.json());

// MySQL configuration (no default table)
const dbConfig = {
  host: 'mysql.default.svc.cluster.local',
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
};

// API endpoint to handle form submission
app.post('/submit', async (req, res) => {
  const { firstName, lastName, database, table } = req.body;

  if (!database || !table) {
    return res.status(400).json({ message: 'Database and table names are required.' });
  }

  try {
    // Create a new connection pool for each request
    const pool = await mysql.createPool({ ...dbConfig, database });

    // Ensure database and table exist
    await pool.query(`CREATE DATABASE IF NOT EXISTS ${database}`);
    await pool.query(`USE ${database}`);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255)
      )
    `);

    // Insert data
    await pool.execute(`
      INSERT INTO ${table} (first_name, last_name) VALUES (?, ?)
    `, [firstName, lastName]);

    // End the connection
    pool.end();

    res.json({ message: 'Data saved to database successfully' });
  } catch (err) {
    console.error('MySQL error:', err.code, err.message);
    res.status(500).json({ message: 'Error saving data to database', error: err.message });
  }
});

// ... (rest of the code: health check, server start)
