const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Application = require('../models/Application');
const User = require('../models/User');

function serializeApplication(app) {
  return {
    id: app._id,
    program_id: app.programId,
    name: app.name,
    email: app.email,
    department: app.department ?? null,
    notes: app.notes ?? null,
    status: app.status,
    applied_at: app.appliedAt,
  };
}

async function createApplication(req, res, next) {
  try {
    const { programId, name, email, department, notes } = req.body;
    const newApp = await Application.create({ programId, name, email, department, notes });
    res.status(201).json({ application: serializeApplication(newApp) });
  } catch (err) { next(err); }
}

async function listApplications(req, res, next) {
  try {
    const { programId, status } = req.query;
    const filter = {};
    if (programId) filter.programId = programId;
    if (status) filter.status = status;
    
    const applications = await Application.find(filter).sort({ appliedAt: -1 });
    res.json({ applications: applications.map(serializeApplication) });
  } catch (err) { next(err); }
}

async function updateApplication(req, res, next) {
  try {
    const { status, notes } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, 
      { status, notes }, { new: true, runValidators: true });
    
    if (!app) return res.status(404).json({ message: 'Application not found.' });
    res.json({ application: serializeApplication(app) });
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
      // Pass the plain password here — the User model's pre-save hook hashes it automatically.
      user = await User.create({ name: app.name, email: app.email, password: tempPassword, role: 'intern', department: app.department });
    }

    app.status = 'onboarded';
    app.onboardedUserId = user._id;
    await app.save();

    res.json({ application: serializeApplication(app), userId: user._id, tempPassword, message: 'Onboarding successful.' });
  } catch (err) { next(err); }
}

module.exports = { createApplication, listApplications, updateApplication, onboardApplication };