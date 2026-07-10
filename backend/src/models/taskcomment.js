const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('TaskComment', commentSchema);