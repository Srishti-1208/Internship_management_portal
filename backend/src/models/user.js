const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'mentor', 'intern'], default: 'intern' },
  department: { type: String, default: null },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resetPasswordToken: { type: String, select: false, default: null },
  resetPasswordExpires: { type: Date, select: false, default: null },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);