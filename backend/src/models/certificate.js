const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Add this
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  certificateCode: { type: String, unique: true, required: true },
  attendancePct: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issuedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);