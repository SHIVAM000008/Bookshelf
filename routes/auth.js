const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const WEEK = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  };
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

function sendToken(user, status, res) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { ...cookieOptions(), maxAge: WEEK });
  res.status(status).json(publicUser(user));
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const role = adminEmail && cleanEmail === adminEmail ? 'admin' : 'user';

    const user = await User.create({ name, email: cleanEmail, password, role });
    sendToken(user, 201, res);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That email is already registered' });
    }
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ message });
    }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    const passwordMatches = user && (await user.checkPassword(password));
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.json({ message: 'Logged out' });
});

router.get('/me', protect, (req, res) => {
  res.json(publicUser(req.user));
});

module.exports = router;
