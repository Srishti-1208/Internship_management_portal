const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Helper to get filter based on role
const getFilter = (req) => (req.user.role === 'mentor' ? { mentorId: req.user.id } : {});

async function getOverview(req, res, next) {
  try {
    const filter = getFilter(req);
    const users = await User.find({ role: 'intern', ...filter });
    const userIds = users.map(u => u._id);

    // Get today's attendance summary
    const today = new Date().setHours(0,0,0,0);
    const stats = await Attendance.aggregate([
      { $match: { userId: { $in: userIds }, date: { $gte: new Date(today) } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Map stats to variables... (similar logic to your SQL result processing)
    res.json({ totalInterns: userIds.length, stats });
  } catch (err) { next(err); }
}
// Add this definition to your analyticsController.js
async function getInternSummary(req, res, next) {
  try {
    // You can customize this logic based on your needs
    const summary = await Attendance.aggregate([
      { $group: { 
          _id: "$userId", 
          totalPresent: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } }
    ]);
    res.json({ summary });
  } catch (err) {
    next(err);
  }
}
async function getDepartmentBreakdown(req, res, next) {
  try {
    // Aggregation to count interns per department
    const breakdown = await User.aggregate([
      { $match: { role: 'intern' } },
      { $group: { _id: "$department", count: { $sum: 1 } } }
    ]);
    res.json({ breakdown });
  } catch (err) {
    next(err);
  }
}

async function getTrend(req, res, next) {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 14, 90);
    const filter = getFilter(req);
    const userIds = (await User.find({ role: 'intern', ...filter })).map(u => u._id);

    const trend = await Attendance.aggregate([
      { $match: { userId: { $in: userIds }, date: { $gte: new Date(Date.now() - days * 86400000) } } },
      { $group: { 
          _id: "$date", 
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } }
          // ... add other statuses
      }},
      { $sort: { _id: 1 } }
    ]);
    res.json({ trend });
  } catch (err) { next(err); }
}

module.exports = {
  getOverview,
  getTrend,
  getInternSummary,
  getDepartmentBreakdown,
};