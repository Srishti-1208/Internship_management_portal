const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');

// POST /api/applications  (admin only) — add an applicant to a program's pipeline
async function createApplication(req, res, next) {
  try {
    const { programId, name, email, department, notes } = req.body;
    if (!programId || !name || !email) {
      return res.status(400).json({ message: 'programId, name and email are required.' });
    }

    const result = await pool.query(
      `INSERT INTO applications (program_id, name, email, department, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [programId, name, email, department || null, notes || null]
    );

    res.status(201).json({ application: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/applications?programId=&status=
async function listApplications(req, res, next) {
  try {
    const { programId, status } = req.query;
    const params = [];
    let query = 'SELECT * FROM applications WHERE 1=1';

    if (programId) {
      params.push(programId);
      query += ` AND program_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY applied_at DESC';

    const result = await pool.query(query, params);
    res.json({ applications: result.rows });
  } catch (err) {
    next(err);
  }
}

// PUT /api/applications/:id  (admin only) — move through the pipeline / edit notes
async function updateApplication(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const allowed = ['applied', 'shortlisted', 'offered', 'rejected', 'onboarded'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }
    if (status === 'onboarded') {
      return res.status(400).json({ message: 'Use POST /api/applications/:id/onboard to onboard an applicant.' });
    }

    const result = await pool.query(
      `UPDATE applications SET
         status = COALESCE($1, status),
         notes = COALESCE($2, notes)
       WHERE id = $3 RETURNING *`,
      [status || null, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    res.json({ application: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/applications/:id/onboard  (admin only)
// Converts an 'offered' applicant into a real user account, adds them to the program,
// and returns a one-time temporary password for the admin to share with them.
async function onboardApplication(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { mentorId } = req.body;

    const appResult = await client.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    const application = appResult.rows[0];

    if (application.status === 'onboarded') {
      return res.status(409).json({ message: 'This applicant has already been onboarded.' });
    }
    if (application.status === 'rejected') {
      return res.status(400).json({ message: 'Cannot onboard a rejected applicant.' });
    }

    if (mentorId) {
      const mentorCheck = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'mentor'", [mentorId]);
      if (mentorCheck.rows.length === 0) {
        return res.status(400).json({ message: 'mentorId does not refer to a valid mentor.' });
      }
    }

    await client.query('BEGIN');

    // Reuse an existing account if this email is already a user; otherwise create one.
    let userResult = await client.query('SELECT id FROM users WHERE email = $1', [application.email]);
    let tempPassword = null;
    let userId;

    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      if (mentorId) {
        await client.query('UPDATE users SET mentor_id = $1 WHERE id = $2', [mentorId, userId]);
      }
    } else {
      tempPassword = crypto.randomBytes(6).toString('base64url'); // e.g. "aZ3f9Kx2"
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const insertUser = await client.query(
        `INSERT INTO users (name, email, password_hash, role, department, mentor_id)
         VALUES ($1, $2, $3, 'intern', $4, $5) RETURNING id`,
        [application.name, application.email, passwordHash, application.department, mentorId || null]
      );
      userId = insertUser.rows[0].id;
    }

    await client.query(
      `INSERT INTO program_interns (program_id, user_id) VALUES ($1, $2)
       ON CONFLICT (program_id, user_id) DO NOTHING`,
      [application.program_id, userId]
    );

    const updatedApp = await client.query(
      `UPDATE applications SET status = 'onboarded', onboarded_user_id = $1 WHERE id = $2 RETURNING *`,
      [userId, id]
    );

    await client.query('COMMIT');

    res.json({
      application: updatedApp.rows[0],
      userId,
      tempPassword, // null if the user account already existed
      message: tempPassword
        ? 'New account created. Share this temporary password with the intern — it will not be shown again.'
        : 'Existing account linked to this program.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { createApplication, listApplications, updateApplication, onboardApplication };
