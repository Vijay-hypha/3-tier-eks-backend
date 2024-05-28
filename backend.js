const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// MySQL credentials (environment variables assumed to be set)
const dbConfig = {
    host: 'mysql.default.svc.cluster.local',
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    table: process.env.MYSQL_TABLE
};

// API endpoint to handle form submission
app.post('/submit', async (req, res) => {
    try {
        const { firstName, lastName } = req.body;

        // Create connection on each request (no global pool)
        const connection = await mysql.createConnection(dbConfig);

        // Check and create database
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);

        // Select database
        await connection.query(`USE ${dbConfig.database}`);

        // Check and create table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS ${dbConfig.table} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(255),
                last_name VARCHAR(255)
            )
        `);

        // Insert data
        await connection.execute(`
            INSERT INTO ${dbConfig.table} (first_name, last_name) VALUES (?, ?)
        `, [firstName, lastName]);

        // Close connection
        await connection.end();

        res.json({ message: 'Data saved to database successfully' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Error saving data to database', details: err.message });
    }
});

// Health check endpoint (unchanged)
app.get('/', (req, res) => {
    res.send('Backend service is running!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
