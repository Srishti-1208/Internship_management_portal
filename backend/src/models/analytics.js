const mongoose = require('mongoose');

const attendanceSummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  attendancePct: { type: Number, default: 0 }, // 0 to 100
  lastUpdated: { type: Date, default: Date.now }
});

// Indexing for fast leaderboard lookups
attendanceSummarySchema.index({ attendancePct: -1 });

module.exports = mongoose.model('AttendanceSummary', attendanceSummarySchema);