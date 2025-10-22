const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { User, School, SchoolEmployee, UserSchool, Permission, UserPermission, sequelize } = require('../models/relations');

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
    
    let user = await User.findOne({ 
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

    let isNewUser = false;
    let emailSent = false;
    let user = await User.findOne({ 
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
      // Try to find a matching school_employee by email
      const employee = await SchoolEmployee.findOne({ where: { email } });
      if (!employee) {
        const resp = { message: 'Kullanıcı bulunamadı' };
        if (process.env.NODE_ENV !== 'production') resp.email = email;
        return res.status(404).json(resp);
      }

      // Create user, user_school and assign permissions in a transaction
      const t = await sequelize.transaction();
      try {
        const randomPassword = crypto.randomBytes(10).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await User.create({
          name: employee.name || email.split('@')[0],
          email: email,
          password: hashedPassword,
          role: 'admin',
          is_active: true,
          last_login: new Date(),
          created_at: new Date()
        }, { transaction: t });
        isNewUser = true;

        const userSchool = await UserSchool.create({ user_id: user.id, school_id: employee.school_id }, { transaction: t });

        // Find permission ids for the named permissions
        const { Op } = require('sequelize');
        const perms = await Permission.findAll({ where: { name: { [Op.in]: ['Destek Talepleri', 'Personel Destek Talebi'] } }, transaction: t });
        for (const p of perms) {
          // UserPermission expects user_schools_id per model definition
          await UserPermission.create({ user_id: user.id, permission_id: p.id, user_schools_id: userSchool.id }, { transaction: t });
        }

        await t.commit();
        // reload user with schools relation
        user = await User.findByPk(user.id, {
          include: [{ model: School, as: 'schools', attributes: ['id', 'name', 'code'], through: { attributes: ['is_primary'], as: 'assignment' } }]
        });
        // Send onboarding email with the generated password (best effort)
        try {
          const emailService = require('../services/emailService');
          const config = require('../../config');
          const frontend = (config.frontendBaseUrl || process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '') || '';
          const loginUrl = frontend ? `${frontend}/login` : '';
          const subject = 'Okul Demirbaş Sistemi - Hesap Oluşturuldu';
          const html = `<p>Merhaba ${user.name || ''},</p>
            <p>Okula atandığınız için bir hesap oluşturuldu. Aşağıdaki bilgilerle giriş yapabilirsiniz:</p>
            <ul><li>Email: ${user.email}</li><li>Şifre: <strong>${randomPassword}</strong></li></ul>
            ${loginUrl ? `<p>Hemen giriş yapmak için: <a href="${loginUrl}">${loginUrl}</a></p>` : ''}
            <p>Güvenlik nedeniyle ilk girişte şifrenizi değiştirmenizi öneririz.</p>
            <p>Saygılarımızla,<br/>Okul Demirbaş Ekibi</p>`;
          const text = `Merhaba ${user.name || ''},\n\nOkula atandığınız için bir hesap oluşturuldu.\n\nEmail: ${user.email}\nŞifre: ${randomPassword}\n\n${loginUrl ? 'Giriş: ' + loginUrl + '\n\n' : ''}Güvenlik nedeniyle ilk girişte şifrenizi değiştirmenizi öneririz.\n\nSaygılarımızla,\nOkul Demirbaş Ekibi`;
          await emailService.sendMail({ to: user.email, subject, html, text });
          emailSent = true;
        } catch (mailErr) {
          console.error('Onboarding email failed:', mailErr && mailErr.message ? mailErr.message : mailErr);
          emailSent = false;
          // don't fail the request because of email send failure
        }
      } catch (err) {
        await t.rollback();
        console.error('Error creating user from school_employee:', err);
        return res.status(500).json({ message: 'Kullanıcı oluşturulamadı', error: err.message });
      }
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
    // Include a suggested redirect target so frontend can navigate the user to the faults page
    return res.json({ token, user: userResponse, redirect: '/faults', created: isNewUser, email_sent: emailSent });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(400).json({ error: err.message });
  }
};
