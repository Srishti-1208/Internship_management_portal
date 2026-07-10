const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, passwordHash: String, role: String, department: String, mentorId: mongoose.Schema.Types.ObjectId
});
module.exports = mongoose.models.User || mongoose.model('User', userSchema);