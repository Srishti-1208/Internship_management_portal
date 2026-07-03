const pool = require('../config/db');

// Restricts mentors to only their own interns; admins see all.
function mentorScopeClause(req, paramIndex) {
  if (req.user.role === 'mentor') {
    return { clause: ` AND u.mentor_id = $${paramIndex}`, param: req.user.id };
  }
  return { clause: '', param: null };
}

// GET /api/analytics/overview
async function getOverview(req, res, next) {
  try {
    const params = [];
    let scopeClause = '';
    if (req.user.role === 'mentor') {
      params.push(req.user.id);
      scopeClause = ` AND u.mentor_id = $${params.length}`;
    }

    const internCountQ = await pool.query(
      `SELECT COUNT(*) FROM users u WHERE u.role = 'intern'${scopeClause}`,
      params
    );

    const todayQ = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE a.status = 'present') AS present_today,
         COUNT(*) FILTER (WHERE a.status = 'absent') AS absent_today,
         COUNT(*) FILTER (WHERE a.status = 'half_day') AS half_day_today,
         COUNT(*) FILTER (WHERE a.status = 'leave') AS leave_today
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       WHERE a.date = CURRENT_DATE AND u.role = 'intern'${scopeClause}`,
      params
    );

    const avgAttendanceQ = await pool.query(
      `SELECT ROUND(AVG(attendance_pct), 1) AS avg_attendance_pct
       FROM intern_attendance_summary s
       JOIN users u ON u.id = s.user_id
       WHERE 1=1${scopeClause}`,
      params
    );

    const totalInterns = parseInt(internCountQ.rows[0].count, 10);

    res.json({
      totalInterns,
      today: {
        present: parseInt(todayQ.rows[0].present_today, 10) || 0,
        absent: parseInt(todayQ.rows[0].absent_today, 10) || 0,
        halfDay: parseInt(todayQ.rows[0].half_day_today, 10) || 0,
        leave: parseInt(todayQ.rows[0].leave_today, 10) || 0,
        notMarked: Math.max(
          totalInterns -
            ((parseInt(todayQ.rows[0].present_today, 10) || 0) +
              (parseInt(todayQ.rows[0].absent_today, 10) || 0) +
              (parseInt(todayQ.rows[0].half_day_today, 10) || 0) +
              (parseInt(todayQ.rows[0].leave_today, 10) || 0)),
          0
        ),
      },
      avgAttendancePct: parseFloat(avgAttendanceQ.rows[0].avg_attendance_pct) || 0,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/trend?days=14
async function getTrend(req, res, next) {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 14, 90);
    const params = [];
    let scopeClause = '';
    if (req.user.role === 'mentor') {
      params.push(req.user.id);
      scopeClause = ` AND u.mentor_id = $${params.length}`;
    }
    params.push(days);

    const result = await pool.query(
      `SELECT
         a.date,
         COUNT(*) FILTER (WHERE a.status = 'present') AS present,
         COUNT(*) FILTER (WHERE a.status = 'absent') AS absent,
         COUNT(*) FILTER (WHERE a.status = 'half_day') AS half_day,
         COUNT(*) FILTER (WHERE a.status = 'leave') AS leave
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       WHERE u.role = 'intern' AND a.date >= CURRENT_DATE - ($${params.length}::int || ' days')::interval${scopeClause}
       GROUP BY a.date
       ORDER BY a.date ASC`,
      params
    );

    res.json({ trend: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/interns  (per-intern leaderboard/summary)
async function getInternSummary(req, res, next) {
  try {
    const params = [];
    let scopeClause = '';
    if (req.user.role === 'mentor') {
      params.push(req.user.id);
      scopeClause = ` WHERE u.mentor_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT s.* FROM intern_attendance_summary s
       JOIN users u ON u.id = s.user_id${scopeClause}
       ORDER BY s.attendance_pct DESC NULLS LAST`,
      params
    );

    res.json({ interns: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/department-breakdown
async function getDepartmentBreakdown(req, res, next) {
  try {
    const params = [];
    let scopeClause = '';
    if (req.user.role === 'mentor') {
      params.push(req.user.id);
      scopeClause = ` AND u.mentor_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
         u.department,
         COUNT(DISTINCT u.id) AS intern_count,
         ROUND(AVG(s.attendance_pct), 1) AS avg_attendance_pct
       FROM users u
       LEFT JOIN intern_attendance_summary s ON s.user_id = u.id
       WHERE u.role = 'intern'${scopeClause}
       GROUP BY u.department
       ORDER BY intern_count DESC`,
      params
    );

    res.json({ departments: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverview, getTrend, getInternSummary, getDepartmentBreakdown };
