const pool = require('../config/db');

// POST /api/attendance/checkin  (intern only)
async function checkIn(req, res, next) {
  try {
    const userId = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND date = CURRENT_DATE',
      [userId]
    );

    if (existing.rows.length > 0 && existing.rows[0].check_in) {
      return res.status(409).json({ message: 'Already checked in today.' });
    }

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE attendance SET check_in = now(), status = 'present'
         WHERE user_id = $1 AND date = CURRENT_DATE RETURNING *`,
        [userId]
      );
    } else {
      result = await pool.query(
        `INSERT INTO attendance (user_id, date, check_in, status)
         VALUES ($1, CURRENT_DATE, now(), 'present') RETURNING *`,
        [userId]
      );
    }

    res.status(201).json({ attendance: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/attendance/checkout  (intern only)
async function checkOut(req, res, next) {
  try {
    const userId = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND date = CURRENT_DATE',
      [userId]
    );

    if (existing.rows.length === 0 || !existing.rows[0].check_in) {
      return res.status(400).json({ message: 'You must check in before checking out.' });
    }
    if (existing.rows[0].check_out) {
      return res.status(409).json({ message: 'Already checked out today.' });
    }

    // If checked in and worked less than half a standard day, mark half_day
    const result = await pool.query(
      `UPDATE attendance
       SET check_out = now(),
           status = CASE
             WHEN EXTRACT(EPOCH FROM (now() - check_in)) / 3600 < 4 THEN 'half_day'::attendance_status
             ELSE status
           END
       WHERE user_id = $1 AND date = CURRENT_DATE
       RETURNING *`,
      [userId]
    );

    res.json({ attendance: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/me  (intern's own history)
async function getMyAttendance(req, res, next) {
  try {
    const { from, to } = req.query;
    const params = [req.user.id];
    let query = 'SELECT * FROM attendance WHERE user_id = $1';

    if (from) {
      params.push(from);
      query += ` AND date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND date <= $${params.length}`;
    }
    query += ' ORDER BY date DESC';

    const result = await pool.query(query, params);
    res.json({ attendance: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance  (admin/mentor view, filterable by userId/date range/status)
async function listAttendance(req, res, next) {
  try {
    const { userId, from, to, status, department } = req.query;
    const params = [];
    let query = `
      SELECT a.*, u.name AS intern_name, u.department, u.mentor_id
      FROM attendance a
      JOIN users u ON u.id = a.user_id
      WHERE u.role = 'intern'`;

    // Mentors only see their own interns; admins see everyone
    if (req.user.role === 'mentor') {
      params.push(req.user.id);
      query += ` AND u.mentor_id = $${params.length}`;
    }
    if (userId) {
      params.push(userId);
      query += ` AND a.user_id = $${params.length}`;
    }
    if (from) {
      params.push(from);
      query += ` AND a.date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND a.date <= $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    if (department) {
      params.push(department);
      query += ` AND u.department = $${params.length}`;
    }
    query += ' ORDER BY a.date DESC, u.name ASC';

    const result = await pool.query(query, params);
    res.json({ attendance: result.rows });
  } catch (err) {
    next(err);
  }
}

// PUT /api/attendance/:id  (admin/mentor override — status/remarks)
async function updateAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const allowedStatuses = ['present', 'absent', 'half_day', 'leave'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowedStatuses.join(', ')}` });
    }

    // Mentors may only edit their own interns' records
    if (req.user.role === 'mentor') {
      const check = await pool.query(
        `SELECT a.id FROM attendance a JOIN users u ON u.id = a.user_id
         WHERE a.id = $1 AND u.mentor_id = $2`,
        [id, req.user.id]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: 'You can only edit attendance for your own interns.' });
      }
    }

    const result = await pool.query(
      `UPDATE attendance SET
         status = COALESCE($1, status),
         remarks = COALESCE($2, remarks)
       WHERE id = $3 RETURNING *`,
      [status || null, remarks || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    res.json({ attendance: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkIn, checkOut, getMyAttendance, listAttendance, updateAttendance };
