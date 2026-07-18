const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  department: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['draft', 'active', 'completed', 'archived'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interns: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
  }] // Many-to-many reference, with per-intern enrollment date
});

module.exports = mongoose.model('Program', programSchema);