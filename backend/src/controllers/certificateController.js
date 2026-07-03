const crypto = require('crypto');
const pool = require('../config/db');

function generateCode() {
  return crypto.randomBytes(9).toString('hex').toUpperCase(); // e.g. 18-char code
}

// GET /api/certificates/eligibility?programId=  (admin/mentor)
// Pulls attendance % (from intern_attendance_summary) and avg review score
// (from intern_review_summary) so the admin can see who qualifies before issuing.
async function checkEligibility(req, res, next) {
  try {
    const { programId } = req.query;
    if (!programId) {
      return res.status(400).json({ message: 'programId query param is required.' });
    }

    const result = await pool.query(
      `SELECT
         u.id AS intern_id, u.name, u.email,
         COALESCE(a.attendance_pct, 0) AS attendance_pct,
         COALESCE(r.avg_score, 0) AS avg_score,
         c.id IS NOT NULL AS already_issued,
         c.certificate_code
       FROM program_interns pi
       JOIN users u ON u.id = pi.user_id
       LEFT JOIN intern_attendance_summary a ON a.user_id = u.id
       LEFT JOIN intern_review_summary r ON r.user_id = u.id
       LEFT JOIN certificates c ON c.intern_id = u.id AND c.program_id = pi.program_id
       WHERE pi.program_id = $1
       ORDER BY u.name ASC`,
      [programId]
    );

    res.json({ interns: result.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/certificates  (admin only) — issue a certificate for an intern in a program
async function issueCertificate(req, res, next) {
  try {
    const { internId, programId } = req.body;
    if (!internId || !programId) {
      return res.status(400).json({ message: 'internId and programId are required.' });
    }

    const statsResult = await pool.query(
      `SELECT
         COALESCE(a.attendance_pct, 0) AS attendance_pct,
         COALESCE(r.avg_score, 0) AS avg_score
       FROM users u
       LEFT JOIN intern_attendance_summary a ON a.user_id = u.id
       LEFT JOIN intern_review_summary r ON r.user_id = u.id
       WHERE u.id = $1`,
      [internId]
    );
    const stats = statsResult.rows[0] || { attendance_pct: 0, avg_score: 0 };

    const code = generateCode();
    const result = await pool.query(
      `INSERT INTO certificates (intern_id, program_id, certificate_code, attendance_pct, avg_score, issued_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (intern_id, program_id) DO UPDATE
         SET attendance_pct = $4, avg_score = $5, issued_by = $6, issued_at = now()
       RETURNING *`,
      [internId, programId, code, stats.attendance_pct, stats.avg_score, req.user.id]
    );

    res.status(201).json({ certificate: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/certificates/mine  (intern — their own issued certificates)
async function listMyCertificates(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT c.*, p.name AS program_name
       FROM certificates c JOIN programs p ON p.id = c.program_id
       WHERE c.intern_id = $1 ORDER BY c.issued_at DESC`,
      [req.user.id]
    );
    res.json({ certificates: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/certificates/verify/:code  (public — no auth — for verification)
async function verifyCertificate(req, res, next) {
  try {
    const { code } = req.params;
    const result = await pool.query(
      `SELECT c.certificate_code, c.attendance_pct, c.avg_score, c.issued_at,
              u.name AS intern_name, p.name AS program_name
       FROM certificates c
       JOIN users u ON u.id = c.intern_id
       JOIN programs p ON p.id = c.program_id
       WHERE c.certificate_code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'No certificate found with this code.' });
    }

    res.json({ valid: true, certificate: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkEligibility, issueCertificate, listMyCertificates, verifyCertificate };
