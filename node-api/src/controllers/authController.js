const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, School } = require('../models/relations');
const { OAuth2Client } = require('google-auth-library');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  console.log('Login request headers:', req.headers);
  console.log('Login request body:', req.body);
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email ve şifre gerekli' });
    }
    
    const user = await User.findOne({ 
      where: { email },
      include: [
        {
          model: School,
          as: 'schools',
          attributes: ['id', 'name', 'code'],
          through: { attributes: ['is_primary'], as: 'assignment' }
        }
      ]
    });
    console.log('User found:', user ? user.email : 'not found');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    
    if (!user.is_active) {
      return res.status(401).json({ message: 'Hesabınız pasif durumda' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    console.log('Password from request:', password);
    console.log('Hash from database:', user.password);
    console.log('Password valid:', valid);
    if (!valid) return res.status(401).json({ message: 'Şifre yanlış' });
    
    if (!process.env.JWT_SECRET) {
      console.log('JWT_SECRET is missing');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Last login güncelle
    await user.update({ last_login: new Date() });
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Response objesi
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schools: user.schools || []
    };
    
    res.json({ token, user: userResponse });
  } catch (err) {
    console.log('Login error:', err);
    res.status(400).json({ error: err.message });
  }
};

// Kullanıcı profil bilgilerini getir (token ile)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'is_active', 'last_login'],
      include: [
        {
          model: School,
          as: 'schools',
          attributes: ['id', 'name', 'code'],
          through: { attributes: ['is_primary'], as: 'assignment' }
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Google OAuth2 login using id_token (from client)
exports.googleLogin = async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) return res.status(400).json({ message: 'id_token gerekli' });

    // verify token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: id_token, audience: process.env.GOOGLE_CLIENT_ID || undefined });
    const payload = ticket.getPayload();
    // Debug: log payload to help troubleshooting
    console.log('Google ID token payload:', payload);
    const email = payload && payload.email;
    console.log('Email extracted from token:', email);
    if (!email) return res.status(400).json({ message: 'Geçersiz token' });

    const user = await User.findOne({ 
      where: { email },
      include: [
        {
          model: School,
          as: 'schools',
          attributes: ['id', 'name', 'code'],
          through: { attributes: ['is_primary'], as: 'assignment' }
        }
      ]
    });
    console.log('Database user lookup result for', email, ':', user ? 'FOUND' : 'NOT FOUND');
    if (!user) {
      const resp = { message: 'Kullanıcı bulunamadı' };
      // In development include the email we tried to lookup to help debugging
      if (process.env.NODE_ENV !== 'production') resp.email = email;
      return res.status(404).json(resp);
    }
    if (!user.is_active) return res.status(401).json({ message: 'Hesabınız pasif durumda' });
    // Süper adminlerin okulu olmayabilir; sadece süper admin değilse okul atanmış olmasını iste
    if (user.role !== 'super_admin' && (!user.schools || user.schools.length === 0)) {
      return res.status(403).json({ message: 'Hiçbir okul atanmadı' });
    }

    // Last login güncelle
    await user.update({ last_login: new Date() });

    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Server configuration error' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schools: user.schools || []
    };
    return res.json({ token, user: userResponse });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(400).json({ error: err.message });
  }
};
