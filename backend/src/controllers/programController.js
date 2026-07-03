const pool = require('../config/db');

// POST /api/programs  (admin only)
async function createProgram(req, res, next) {
  try {
    const { name, description, department, startDate, endDate, status } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'name is required.' });
    }

    const allowedStatus = ['draft', 'active', 'completed', 'archived'];
    const finalStatus = allowedStatus.includes(status) ? status : 'draft';

    const result = await pool.query(
      `INSERT INTO programs (name, description, department, start_date, end_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description || null, department || null, startDate || null, endDate || null, finalStatus, req.user.id]
    );

    res.status(201).json({ program: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/programs  (admin sees all; mentor sees programs that have at least one of their interns)
async function listPrograms(req, res, next) {
  try {
    const params = [];
    let query = `
      SELECT p.*,
        COUNT(DISTINCT pi.user_id) AS intern_count
      FROM programs p
      LEFT JOIN program_interns pi ON pi.program_id = p.id`;

    if (req.user.role === 'mentor') {
      params.push(req.user.id);
      query += ` LEFT JOIN users u ON u.id = pi.user_id AND u.mentor_id = $${params.length}`;
      query += ` WHERE u.id IS NOT NULL`;
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ programs: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/programs/:id  (includes assigned interns)
async function getProgram(req, res, next) {
  try {
    const { id } = req.params;

    const programResult = await pool.query('SELECT * FROM programs WHERE id = $1', [id]);
    if (programResult.rows.length === 0) {
      return res.status(404).json({ message: 'Program not found.' });
    }

    const internsResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.department, u.mentor_id, m.name AS mentor_name, pi.joined_at
       FROM program_interns pi
       JOIN users u ON u.id = pi.user_id
       LEFT JOIN users m ON m.id = u.mentor_id
       WHERE pi.program_id = $1
       ORDER BY u.name ASC`,
      [id]
    );

    res.json({ program: programResult.rows[0], interns: internsResult.rows });
  } catch (err) {
    next(err);
  }
}

// PUT /api/programs/:id  (admin only)
async function updateProgram(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, department, startDate, endDate, status } = req.body;

    const allowedStatus = ['draft', 'active', 'completed', 'archived'];
    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowedStatus.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE programs SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         department = COALESCE($3, department),
         start_date = COALESCE($4, start_date),
         end_date = COALESCE($5, end_date),
         status = COALESCE($6, status)
       WHERE id = $7 RETURNING *`,
      [name || null, description || null, department || null, startDate || null, endDate || null, status || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Program not found.' });
    }

    res.json({ program: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/programs/:id  (admin only)
async function deleteProgram(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM programs WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Program not found.' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// POST /api/programs/:id/interns  (admin only) — assign an existing intern user, optionally set mentor
async function addInternToProgram(req, res, next) {
  try {
    const { id } = req.params;
    const { userId, mentorId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const userCheck = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (userCheck.rows[0].role !== 'intern') {
      return res.status(400).json({ message: 'Only users with the intern role can be added to a program.' });
    }

    if (mentorId) {
      const mentorCheck = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'mentor'", [mentorId]);
      if (mentorCheck.rows.length === 0) {
        return res.status(400).json({ message: 'mentorId does not refer to a valid mentor.' });
      }
      await pool.query('UPDATE users SET mentor_id = $1 WHERE id = $2', [mentorId, userId]);
    }

    const result = await pool.query(
      `INSERT INTO program_interns (program_id, user_id) VALUES ($1, $2)
       ON CONFLICT (program_id, user_id) DO NOTHING RETURNING *`,
      [id, userId]
    );

    res.status(201).json({ assigned: result.rows[0] || { program_id: id, user_id: userId, already_assigned: true } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/programs/:id/interns/:userId  (admin only)
async function removeInternFromProgram(req, res, next) {
  try {
    const { id, userId } = req.params;
    const result = await pool.query(
      'DELETE FROM program_interns WHERE program_id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'This intern is not assigned to this program.' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// GET /api/programs/unassigned-interns?programId=  (admin only — interns not yet in this program)
async function getUnassignedInterns(req, res, next) {
  try {
    const { programId } = req.query;
    if (!programId) {
      return res.status(400).json({ message: 'programId query param is required.' });
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.department
       FROM users u
       WHERE u.role = 'intern'
         AND u.id NOT IN (
           SELECT user_id FROM program_interns WHERE program_id = $1
         )
       ORDER BY u.name ASC`,
      [programId]
    );

    res.json({ interns: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/programs/mentors/list  (admin only — for the mentor-assignment dropdown)
async function listMentors(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, department FROM users WHERE role = 'mentor' ORDER BY name ASC"
    );
    res.json({ mentors: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProgram,
  listPrograms,
  getProgram,
  updateProgram,
  deleteProgram,
  addInternToProgram,
  removeInternFromProgram,
  getUnassignedInterns,
  listMentors,
};
