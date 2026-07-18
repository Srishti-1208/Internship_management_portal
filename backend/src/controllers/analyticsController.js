const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Helper to get filter based on role
const getFilter = (req) => (req.user.role === 'mentor' ? { mentorId: req.user.id } : {});

async function getOverview(req, res, next) {
  try {
    const filter = getFilter(req);
    const users = await User.find({ role: 'intern', ...filter }).select('_id');
    const userIds = users.map((u) => u._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const statsAgg = await Attendance.aggregate([
      { $match: { userId: { $in: userIds }, date: { $gte: today } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statMap = Object.fromEntries(statsAgg.map((s) => [s._id, s.count]));

    const totalRecords = await Attendance.countDocuments({ userId: { $in: userIds } });
    const presentRecords = await Attendance.countDocuments({
      userId: { $in: userIds },
      status: { $in: ['present', 'half_day'] },
    });
    const avgAttendancePct = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 1000) / 10 : 0;

    res.json({
      totalInterns: userIds.length,
      today: {
        present: statMap.present || 0,
        absent: statMap.absent || 0,
        halfDay: statMap.half_day || 0,
      },
      avgAttendancePct,
    });
  } catch (err) { next(err); }
}

async function getInternSummary(req, res, next) {
  try {
    const filter = getFilter(req);
    const interns = await User.find({ role: 'intern', ...filter }).select('name department');

    const summary = await Promise.all(
      interns.map(async (u) => {
        const total = await Attendance.countDocuments({ userId: u._id });
        const present = await Attendance.countDocuments({
          userId: u._id,
          status: { $in: ['present', 'half_day'] },
        });
        return {
          user_id: u._id,
          name: u.name,
          department: u.department ?? null,
          attendance_pct: total > 0 ? Math.round((present / total) * 1000) / 10 : null,
        };
      })
    );

    res.json({ interns: summary });
  } catch (err) {
    next(err);
  }
}

async function getDepartmentBreakdown(req, res, next) {
  try {
    const NONE = '__unassigned__';
    const interns = await User.find({ role: 'intern' }).select('department');

    const byDept = {};
    interns.forEach((u) => {
      const key = u.department || NONE;
      if (!byDept[key]) byDept[key] = [];
      byDept[key].push(u._id);
    });

    const departments = await Promise.all(
      Object.entries(byDept).map(async ([department, ids]) => {
        const total = await Attendance.countDocuments({ userId: { $in: ids } });
        const present = await Attendance.countDocuments({
          userId: { $in: ids },
          status: { $in: ['present', 'half_day'] },
        });
        return {
          department: department === NONE ? null : department,
          intern_count: ids.length,
          avg_attendance_pct: total > 0 ? Math.round((present / total) * 1000) / 10 : null,
        };
      })
    );

    res.json({ departments });
  } catch (err) {
    next(err);
  }
}

async function getTrend(req, res, next) {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 14, 90);
    const filter = getFilter(req);
    const userIds = (await User.find({ role: 'intern', ...filter }).select('_id')).map((u) => u._id);
    const since = new Date(Date.now() - days * 86400000);

    const trend = await Attendance.aggregate([
      { $match: { userId: { $in: userIds }, date: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ trend: trend.map((t) => ({ date: t._id, present: t.present, absent: t.absent })) });
  } catch (err) { next(err); }
}

module.exports = {
  getOverview,
  getTrend,
  getInternSummary,
  getDepartmentBreakdown,
};