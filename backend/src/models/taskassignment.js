const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['assigned', 'submitted', 'needs_revision', 'approved'], default: 'assigned' },
  submission: {
    contentUrl: String,
    notes: String,
    submittedAt: Date,
    review: {
      score: Number,
      feedback: String,
      reviewedAt: Date,
      reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  }
});

module.exports = mongoose.model('TaskAssignment', assignmentSchema);