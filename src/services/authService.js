const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory user database
const users = [];

class AuthService {
  async register(username, password, role = 'staff') {
    // Check if user already exists
    const exists = users.find(u => u.username === username);
    if (exists) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      username,
      password: hashedPassword,
      role
    };

    users.push(newUser);
    
    // Return user info (excluding password)
    return { id: newUser.id, username: newUser.username, role: newUser.role };
  }

  async login(username, password) {
    const user = users.find(u => u.username === username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

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
