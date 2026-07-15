const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'hospital_db',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

/**
 * Get or initialize connection pool
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

/**
 * Initialize database tables and seed default accounts
 */
async function initDB() {
  console.log('[DB INITIALIZATION] Connecting to MySQL host:', dbConfig.host);
  
  // 1. Establish temporary connection without database selected to verify/create database
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    console.log(`[DB INITIALIZATION] Database '${dbConfig.database}' verified/created.`);
  } catch (error) {
    console.error('[DB INITIALIZATION WARNING] Failed to verify/create database:', error.message);
    console.error('Please check if MySQL is running and host/credentials are correct.');
  } finally {
    if (connection) await connection.end();
  }

  // 2. Select pool instance
  const activePool = getPool();

  // 3. Create Users Table
  await activePool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'patient',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // 4. Create Patients Table
  await activePool.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      age INT NOT NULL,
      gender VARCHAR(50) NOT NULL,
      diagnosis VARCHAR(255) NOT NULL,
      status VARCHAR(100) NOT NULL,
      room VARCHAR(50) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // 5. Create Appointments Table
  await activePool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(255) PRIMARY KEY,
      userId INT NOT NULL,
      doctorId VARCHAR(50) NOT NULL,
      doctorName VARCHAR(255) NOT NULL,
      date VARCHAR(50) NOT NULL,
      timeSlot VARCHAR(50) NOT NULL,
      bookedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  console.log('[DB INITIALIZATION] Tables verified/created successfully.');

  // 6. Pre-seed default accounts if users table is empty
  const [rows] = await activePool.query('SELECT COUNT(*) as count FROM users');
  if (rows[0].count === 0) {
    console.log('[DB INITIALIZATION] Seeding default credentials into users table...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password', salt);

    const defaultUsers = [
      ['patient@hospital.com', defaultPassword, 'patient'],
      ['doctor@hospital.com', defaultPassword, 'doctor'],
      ['admin@hospital.com', defaultPassword, 'admin']
    ];

    for (const user of defaultUsers) {
      await activePool.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        user
      );
    }
    console.log('[DB INITIALIZATION] Seeding complete.');
  }

  // 7. Seed default patients if patients table is empty
  const [patientRows] = await activePool.query('SELECT COUNT(*) as count FROM patients');
  if (patientRows[0].count === 0) {
    console.log('[DB INITIALIZATION] Seeding default patient records...');
    const defaultPatients = [
      ['John Doe', 34, 'Male', 'Flu', 'Admitted', '102B'],
      ['Jane Smith', 29, 'Female', 'Migraine', 'Discharged', 'Outpatient']
    ];

    for (const patient of defaultPatients) {
      await activePool.query(
        'INSERT INTO patients (name, age, gender, diagnosis, status, room) VALUES (?, ?, ?, ?, ?, ?)',
        patient
      );
    }
    console.log('[DB INITIALIZATION] Patient records seeded.');
  }
}

module.exports = {
  getPool,
  initDB
};
