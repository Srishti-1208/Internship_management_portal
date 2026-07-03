const pool = require('../config/db');

// ---- Announcements ----

// POST /api/announcements  (admin/mentor)
async function createAnnouncement(req, res, next) {
  try {
    const { programId, title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: 'title and body are required.' });
    }

    const result = await pool.query(
      `INSERT INTO announcements (program_id, author_id, title, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [programId || null, req.user.id, title, body]
    );

    res.status(201).json({ announcement: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/announcements?programId=
// Admin/mentor see everything relevant to their scope; interns see global + announcements
// for programs they're enrolled in.
async function listAnnouncements(req, res, next) {
  try {
    const { programId } = req.query;
    const params = [];
    let query = `
      SELECT a.*, u.name AS author_name, p.name AS program_name
      FROM announcements a
      LEFT JOIN users u ON u.id = a.author_id
      LEFT JOIN programs p ON p.id = a.program_id
      WHERE 1=1`;

    if (req.user.role === 'intern') {
      params.push(req.user.id);
      query += ` AND (a.program_id IS NULL OR a.program_id IN (
        SELECT program_id FROM program_interns WHERE user_id = $${params.length}
      ))`;
    }
    if (programId) {
      params.push(programId);
      query += ` AND (a.program_id = $${params.length} OR a.program_id IS NULL)`;
    }
    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ announcements: result.rows });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/announcements/:id  (admin/mentor, only their own)
async function deleteAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const params = [id];
    let query = 'DELETE FROM announcements WHERE id = $1';
    if (req.user.role === 'mentor') {
      params.push(req.user.id);
      query += ' AND author_id = $2';
    }
    query += ' RETURNING id';

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found or not yours to delete.' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ---- Task comments ----

// Confirms the requesting user has a legitimate reason to see/post on this task:
// admins always; mentors if one of their interns is assigned; interns if assigned themselves.
async function userCanAccessTask(user, taskId) {
  if (user.role === 'admin') return true;

  if (user.role === 'mentor') {
    const check = await pool.query(
      `SELECT 1 FROM task_assignments ta
       JOIN users u ON u.id = ta.intern_id
       WHERE ta.task_id = $1 AND u.mentor_id = $2 LIMIT 1`,
      [taskId, user.id]
    );
    return check.rows.length > 0;
  }

  if (user.role === 'intern') {
    const check = await pool.query(
      'SELECT 1 FROM task_assignments WHERE task_id = $1 AND intern_id = $2 LIMIT 1',
      [taskId, user.id]
    );
    return check.rows.length > 0;
  }

  return false;
}

// POST /api/tasks/:taskId/comments
async function addComment(req, res, next) {
  try {
    const { taskId } = req.params;
    const { body } = req.body;
    if (!body) {
      return res.status(400).json({ message: 'body is required.' });
    }

    const allowed = await userCanAccessTask(req.user, taskId);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have access to this task.' });
    }

    const result = await pool.query(
      `INSERT INTO task_comments (task_id, author_id, body) VALUES ($1, $2, $3) RETURNING *`,
      [taskId, req.user.id, body]
    );

    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:taskId/comments
async function listComments(req, res, next) {
  try {
    const { taskId } = req.params;

    const allowed = await userCanAccessTask(req.user, taskId);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have access to this task.' });
    }

    const result = await pool.query(
      `SELECT c.*, u.name AS author_name, u.role AS author_role
       FROM task_comments c LEFT JOIN users u ON u.id = c.author_id
       WHERE c.task_id = $1 ORDER BY c.created_at ASC`,
      [taskId]
    );
    res.json({ comments: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAnnouncement,
  listAnnouncements,
  deleteAnnouncement,
  addComment,
  listComments,
};
