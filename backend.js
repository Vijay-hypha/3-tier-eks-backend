const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// MySQL credentials
const dbConfig = {
  host: 'mysql.default.svc.cluster.local',
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE, // Read database name from environment variable
  table: process.env.MYSQL_TABLE // Read table name from environment variable
};
let pool; // Declare pool variable outside connect function

// Create MySQL connection
async function connectToMySQL() {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log('Connected to MySQL database');

    // Use pool.execute for database interactions
    await pool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await pool.query(`USE ${dbConfig.database}`);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ${dbConfig.table} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(254)
      )
    `);
    console.log(`Table ${dbConfig.table} created or already exists`);
  } catch (err) {
    console.error('Error connecting to MySQL:', err.code, err.message);
    // Consider adding more robust error handling here (e.g., retries, graceful shutdown)
  }
}

connectToMySQL();

// API endpoint to handle form submission
app.post('/submit', async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    // Use pool.execute for the insert
    await pool.execute(`
      INSERT INTO ${dbConfig.table} (first_name, last_name) VALUES (?, ?)
    `, [firstName, lastName]);

    res.json({ message: 'Data saved to database successfully' });
  } catch (err) {
    console.error('Error inserting data into MySQL:', err.code, err.message); // Log the error code as well
    res.status(500).json({ message: 'Error saving data to database', details: err.message }); 
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Backend service is running!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});