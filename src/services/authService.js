const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

class AuthService {
  /**
   * Register a new user
   */
  async register(username, password, role = 'staff') {
    const pool = getPool();
    
    // Check if user already exists in DB
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user into DB
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    return { 
      id: result.insertId, 
      username, 
      role 
    };
  }

  /**
   * Log in user
   */
  async login(username, password) {
    const pool = getPool();
    
    // Retrieve user from DB
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = rows[0];

    // Validate password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT Token
    const secret = process.env.JWT_SECRET || 'supersecretjwttokenforhackathon';
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      secret,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: { id: user.id, username: user.username, role: user.role }
    };
  }
}

module.exports = new AuthService();
