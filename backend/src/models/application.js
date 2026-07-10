const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  department: String,
  notes: String,
  status: { type: String, enum: ['applied', 'shortlisted', 'offered', 'rejected', 'onboarded'], default: 'applied' },
  onboardedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: 'appliedAt' } });

module.exports = mongoose.model('Application', applicationSchema);