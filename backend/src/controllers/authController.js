const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User'); // Import the Mongoose model
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, role, department, mentorId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required.' });
    }

    const allowedRoles = ['admin', 'mentor', 'intern'];
    const finalRole = allowedRoles.includes(role) ? role : 'intern';

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      department,
      mentorId
    });

    const token = generateToken(user);

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };

    res.status(201).json({ user: userResponse, token });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required.' });

    const user = await User.findOne({ email });

    // Always respond the same way whether or not the account exists —
    // this avoids leaking which emails are registered.
    const genericResponse = {
      message: 'If an account exists for that email, a reset link has been sent.',
    };

    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password/${rawToken}`;

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: `You requested a password reset. Click this link to choose a new password (valid for 1 hour): ${resetLink}\n\nIf you didn't request this, you can ignore this email.`,
    });

    // In non-production environments, also hand back the link directly so the
    // flow can be tested without a real mailbox. Never do this in production.
    if (process.env.NODE_ENV !== 'production' && !emailResult.delivered) {
      genericResponse.devResetLink = resetLink;
    }

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password/:token
async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    user.password = password; // pre-save hook hashes this
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password updated. You can now sign in with your new password.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, forgotPassword, resetPassword };