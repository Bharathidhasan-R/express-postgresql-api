require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const connectDB = async () => {
    const client = await pool.connect();
    try {
        await client.query('SELECT 1');
        console.log('✅ Database connected successfully');
    } finally {
        client.release();
    }
};

module.exports = {
    connectDB,
    query: (text, params) => pool.query(text, params),
    pool
};