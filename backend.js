const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

const app = express();
app.use(bodyParser.json());

const dbConfig = {
  host: 'mysql.default.svc.cluster.local',
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE, 
  table: process.env.MYSQL_TABLE 
};

let pool; 
let databaseInitialized = false; // Flag to track initialization

async function initializeDatabase() {
  if (databaseInitialized) return; // Do nothing if already initialized

  try {
    pool = await mysql.createPool(dbConfig);
    await pool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await pool.query(`USE ${dbConfig.database}`);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ${dbConfig.table} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255)
      )
    `);
    console.log(`Database and table initialized`);
    databaseInitialized = true;
  } catch (err) {
    console.error('Error initializing database:', err.code, err.message);
    // Handle error gracefully (e.g., retry, send error response)
  }
}



// API endpoint to handle form submission
app.post('/submit', async (req, res) => {
  await initializeDatabase(); // Call initialization before processing submission
  // ... (rest of your form submission logic)
});

// Health check endpoint (also initializes the database)
app.get('/', async (req, res) => {
  await initializeDatabase();
  res.send('Backend service is running!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
