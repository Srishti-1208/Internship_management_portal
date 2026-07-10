const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  department: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['draft', 'active', 'completed', 'archived'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Many-to-many reference
});

module.exports = mongoose.model('Program', programSchema);