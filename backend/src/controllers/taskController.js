const pool = require('../config/db');

// POST /api/tasks  (admin/mentor) — create a task within a program, optionally assign immediately
async function createTask(req, res, next) {
  try {
    const { programId, title, description, dueDate, internIds } = req.body;
    if (!programId || !title) {
      return res.status(400).json({ message: 'programId and title are required.' });
    }

    const taskResult = await pool.query(
      `INSERT INTO tasks (program_id, created_by, title, description, due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [programId, req.user.id, title, description || null, dueDate || null]
    );
    const task = taskResult.rows[0];

    if (Array.isArray(internIds) && internIds.length > 0) {
      const values = internIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO task_assignments (task_id, intern_id) VALUES ${values}
         ON CONFLICT (task_id, intern_id) DO NOTHING`,
        [task.id, ...internIds]
      );
    }

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks?programId=  (admin/mentor — tasks they created or that belong to their program's interns)
async function listTasks(req, res, next) {
  try {
    const { programId } = req.query;
    const params = [];
    let query = `
      SELECT t.*, p.name AS program_name,
        COUNT(DISTINCT ta.id) AS assignment_count,
        COUNT(DISTINCT s.id) AS submission_count
      FROM tasks t
      JOIN programs p ON p.id = t.program_id
      LEFT JOIN task_assignments ta ON ta.task_id = t.id
      LEFT JOIN submissions s ON s.assignment_id = ta.id
      WHERE 1=1`;

    if (req.user.role === 'mentor') {
      params.push(req.user.id);
      query += ` AND t.id IN (
        SELECT ta2.task_id FROM task_assignments ta2
        JOIN users u ON u.id = ta2.intern_id
        WHERE u.mentor_id = $${params.length}
      )`;
    }
    if (programId) {
      params.push(programId);
      query += ` AND t.program_id = $${params.length}`;
    }
    query += ' GROUP BY t.id, p.name ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/mine  (intern — tasks assigned to them)
async function listMyTasks(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.id AS task_id, t.title, t.description, t.due_date, t.program_id, p.name AS program_name,
              ta.id AS assignment_id, ta.status,
              s.id AS submission_id, s.content_url, s.notes AS submission_notes, s.submitted_at,
              r.score, r.feedback, r.reviewed_at
       FROM task_assignments ta
       JOIN tasks t ON t.id = ta.task_id
       JOIN programs p ON p.id = t.program_id
       LEFT JOIN submissions s ON s.assignment_id = ta.id
       LEFT JOIN reviews r ON r.submission_id = s.id
       WHERE ta.intern_id = $1
       ORDER BY t.due_date NULLS LAST, t.created_at DESC`,
      [req.user.id]
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id  (task detail + all assignments/submissions/reviews, for mentor/admin)
async function getTask(req, res, next) {
  try {
    const { id } = req.params;

    const taskResult = await pool.query(
      `SELECT t.*, p.name AS program_name FROM tasks t JOIN programs p ON p.id = t.program_id WHERE t.id = $1`,
      [id]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const assignmentsResult = await pool.query(
      `SELECT ta.id AS assignment_id, ta.status, ta.intern_id, u.name AS intern_name, u.email,
              s.id AS submission_id, s.content_url, s.notes AS submission_notes, s.submitted_at,
              r.id AS review_id, r.score, r.feedback, r.reviewed_at
       FROM task_assignments ta
       JOIN users u ON u.id = ta.intern_id
       LEFT JOIN submissions s ON s.assignment_id = ta.id
       LEFT JOIN reviews r ON r.submission_id = s.id
       WHERE ta.task_id = $1
       ORDER BY u.name ASC`,
      [id]
    );

    res.json({ task: taskResult.rows[0], assignments: assignmentsResult.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/assign  (admin/mentor) — assign more interns to an existing task
async function assignTask(req, res, next) {
  try {
    const { id } = req.params;
    const { internIds } = req.body;

    if (!Array.isArray(internIds) || internIds.length === 0) {
      return res.status(400).json({ message: 'internIds must be a non-empty array.' });
    }

    const values = internIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    const result = await pool.query(
      `INSERT INTO task_assignments (task_id, intern_id) VALUES ${values}
       ON CONFLICT (task_id, intern_id) DO NOTHING RETURNING *`,
      [id, ...internIds]
    );

    res.status(201).json({ assigned: result.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/assignments/:assignmentId/submit  (intern) — submit or resubmit work
async function submitWork(req, res, next) {
  try {
    const { assignmentId } = req.params;
    const { contentUrl, notes } = req.body;

    if (!contentUrl) {
      return res.status(400).json({ message: 'contentUrl is required.' });
    }

    const assignmentCheck = await pool.query(
      'SELECT * FROM task_assignments WHERE id = $1 AND intern_id = $2',
      [assignmentId, req.user.id]
    );
    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found for this user.' });
    }

    const existing = await pool.query('SELECT id FROM submissions WHERE assignment_id = $1', [assignmentId]);

    let submission;
    if (existing.rows.length > 0) {
      const updateResult = await pool.query(
        `UPDATE submissions SET content_url = $1, notes = $2, submitted_at = now()
         WHERE assignment_id = $3 RETURNING *`,
        [contentUrl, notes || null, assignmentId]
      );
      submission = updateResult.rows[0];
      // Resubmission after feedback clears the old review
      await pool.query('DELETE FROM reviews WHERE submission_id = $1', [submission.id]);
    } else {
      const insertResult = await pool.query(
        `INSERT INTO submissions (assignment_id, content_url, notes) VALUES ($1, $2, $3) RETURNING *`,
        [assignmentId, contentUrl, notes || null]
      );
      submission = insertResult.rows[0];
    }

    await pool.query(`UPDATE task_assignments SET status = 'submitted' WHERE id = $1`, [assignmentId]);

    res.status(201).json({ submission });
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/submissions/:submissionId/review  (admin/mentor) — score + feedback
async function reviewSubmission(req, res, next) {
  try {
    const { submissionId } = req.params;
    const { score, feedback, approve } = req.body;

    if (score === undefined || score === null) {
      return res.status(400).json({ message: 'score is required.' });
    }

    const submissionCheck = await pool.query(
      `SELECT s.*, ta.id AS assignment_id, ta.intern_id, u.mentor_id
       FROM submissions s
       JOIN task_assignments ta ON ta.id = s.assignment_id
       JOIN users u ON u.id = ta.intern_id
       WHERE s.id = $1`,
      [submissionId]
    );
    if (submissionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found.' });
    }
    if (req.user.role === 'mentor' && submissionCheck.rows[0].mentor_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only review submissions from your own interns.' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (submission_id, reviewer_id, score, feedback)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (submission_id) DO UPDATE SET score = $3, feedback = $4, reviewed_at = now()
       RETURNING *`,
      [submissionId, req.user.id, score, feedback || null]
    );

    const newStatus = approve === false ? 'needs_revision' : 'approved';
    await pool.query('UPDATE task_assignments SET status = $1 WHERE id = $2', [
      newStatus,
      submissionCheck.rows[0].assignment_id,
    ]);

    res.status(201).json({ review: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  listTasks,
  listMyTasks,
  getTask,
  assignTask,
  submitWork,
  reviewSubmission,
};
