const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Application = require('../models/Application');
const User = require('../models/User');

async function createApplication(req, res, next) {
  try {
    const { programId, name, email, department, notes } = req.body;
    const newApp = await Application.create({ programId, name, email, department, notes });
    res.status(201).json({ application: newApp });
  } catch (err) { next(err); }
}

async function listApplications(req, res, next) {
  try {
    const { programId, status } = req.query;
    const filter = {};
    if (programId) filter.programId = programId;
    if (status) filter.status = status;
    
    const applications = await Application.find(filter).sort({ appliedAt: -1 });
    res.json({ applications });
  } catch (err) { next(err); }
}

async function updateApplication(req, res, next) {
  try {
    const { status, notes } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, 
      { status, notes }, { new: true, runValidators: true });
    
    if (!app) return res.status(404).json({ message: 'Application not found.' });
    res.json({ application: app });
  } catch (err) { next(err); }
}

async function onboardApplication(req, res, next) {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found.' });
    
    // ... logic checks (already onboarded/rejected) ...

    let user = await User.findOne({ email: app.email });
    let tempPassword = null;

    if (!user) {
      tempPassword = crypto.randomBytes(6).toString('base64url');
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      user = await User.create({ name: app.name, email: app.email, passwordHash, role: 'intern', department: app.department });
    }

    app.status = 'onboarded';
    app.onboardedUserId = user._id;
    await app.save();

    res.json({ application: app, userId: user._id, tempPassword, message: 'Onboarding successful.' });
  } catch (err) { next(err); }
}

module.exports = { createApplication, listApplications, updateApplication, onboardApplication };