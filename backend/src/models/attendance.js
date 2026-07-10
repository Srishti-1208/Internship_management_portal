const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: () => new Date().setHours(0,0,0,0) },
  checkIn: Date,
  checkOut: Date,
  status: { type: String, enum: ['present', 'absent', 'half_day', 'leave'], default: 'present' },
  remarks: String
});

// Auto-calculate half-day before saving checkout
attendanceSchema.pre('save', function(next) {
  if (this.checkOut && this.checkIn) {
    const hours = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    if (hours < 4) this.status = 'half_day';
  }
  next();
});
// Add this to your existing Attendance model
attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ status: 1 });
module.exports = mongoose.model('Attendance', attendanceSchema);