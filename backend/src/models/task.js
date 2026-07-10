const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  dueDate: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);