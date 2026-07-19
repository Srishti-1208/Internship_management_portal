const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Program = require('../models/Program');
const Attendance = require('../models/Attendance');
const TaskAssignment = require('../models/TaskAssignment');

const generateCode = () => crypto.randomBytes(9).toString('hex').toUpperCase();

// Attendance % and average review score, computed live from real records
// (there is no separate "review summary" collection — reviews live on TaskAssignment).
async function computeStats(internId) {
  const [totalRecords, presentRecords, assignments] = await Promise.all([
    Attendance.countDocuments({ userId: internId }),
    Attendance.countDocuments({ userId: internId, status: { $in: ['present', 'half_day'] } }),
    TaskAssignment.find({ internId, 'submission.review.score': { $ne: null } }).select('submission.review.score'),
  ]);

  const attendancePct = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 1000) / 10 : 0;
  const scores = assignments.map((a) => a.submission?.review?.score).filter((s) => typeof s === 'number');
  const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

  return { attendancePct, avgScore };
}

// GET /certificates/eligibility?programId=...
// Mentors only see their own interns; this mirrors who is allowed to issue.
async function checkEligibility(req, res, next) {
  try {
    const { programId } = req.query;
    if (!programId) return res.status(400).json({ message: 'programId is required.' });

    const program = await Program.findById(programId).populate({
      path: 'interns.user',
      select: 'name email mentorId',
    });
    if (!program) return res.status(404).json({ message: 'Program not found.' });

    let enrolled = program.interns.filter((entry) => entry.user);
    if (req.user.role === 'mentor') {
      enrolled = enrolled.filter((entry) => String(entry.user.mentorId) === String(req.user._id));
    }

    const interns = await Promise.all(
      enrolled.map(async (entry) => {
        const { attendancePct, avgScore } = await computeStats(entry.user._id);
        const existingCert = await Certificate.findOne({ internId: entry.user._id, programId });
        return {
          intern_id: entry.user._id,
          name: entry.user.name,
          attendance_pct: attendancePct,
          avg_score: avgScore,
          already_issued: !!existingCert,
          certificate_code: existingCert?.certificateCode ?? null,
        };
      })
    );

    res.json({ interns });
  } catch (err) { next(err); }
}

// POST /certificates  { internId, programId }
// Mentor-only: a mentor may issue a certificate only for their own interns.
async function issueCertificate(req, res, next) {
  try {
    const { internId, programId } = req.body;
    if (!internId || !programId) {
      return res.status(400).json({ message: 'internId and programId are required.' });
    }

    const intern = await User.findById(internId);
    if (!intern || intern.role !== 'intern') {
      return res.status(404).json({ message: 'Intern not found.' });
    }
    if (String(intern.mentorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only issue certificates for your own interns.' });
    }

    const { attendancePct, avgScore } = await computeStats(internId);

    const cert = await Certificate.findOneAndUpdate(
      { internId, programId },
      {
        internId,
        programId,
        certificateCode: generateCode(),
        attendancePct,
        avgScore,
        issuedBy: req.user._id,
        issuedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ certificate: cert });
  } catch (err) { next(err); }
}

async function verifyCertificate(req, res, next) {
  try {
    const cert = await Certificate.findOne({ certificateCode: req.params.code })
      .populate('internId', 'name')
      .populate('programId', 'name');

    if (!cert) return res.status(404).json({ valid: false });
    res.json({
      valid: true,
      certificate: {
        code: cert.certificateCode,
        intern_name: cert.internId?.name ?? null,
        program_name: cert.programId?.name ?? null,
        attendance_pct: cert.attendancePct,
        avg_score: cert.avgScore,
        issued_at: cert.issuedAt,
      },
    });
  } catch (err) { next(err); }
}

// GET /certificates/mine — for the logged-in intern
async function listMyCertificates(req, res, next) {
  try {
    const certs = await Certificate.find({ internId: req.user._id }).populate('programId', 'name');
    res.json({
      certificates: certs.map((c) => ({
        id: c._id,
        program_name: c.programId?.name ?? 'Program',
        attendance_pct: c.attendancePct,
        avg_score: c.avgScore,
        certificate_code: c.certificateCode,
        issued_at: c.issuedAt,
      })),
    });
  } catch (err) { next(err); }
}

// GET /certificates/all — admin oversight (read-only, admin no longer issues certificates)
async function listAllCertificates(req, res, next) {
  try {
    const certs = await Certificate.find({})
      .populate('internId', 'name')
      .populate('programId', 'name')
      .populate('issuedBy', 'name')
      .sort({ issuedAt: -1 });

    res.json({
      certificates: certs.map((c) => ({
        id: c._id,
        intern_name: c.internId?.name ?? '—',
        program_name: c.programId?.name ?? '—',
        issued_by_name: c.issuedBy?.name ?? '—',
        certificate_code: c.certificateCode,
        issued_at: c.issuedAt,
      })),
    });
  } catch (err) { next(err); }
}

module.exports = {
  checkEligibility,
  issueCertificate,
  verifyCertificate,
  listMyCertificates,
  listAllCertificates,
};
