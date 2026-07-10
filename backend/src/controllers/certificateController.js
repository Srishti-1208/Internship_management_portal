const crypto = require('crypto');
const Certificate = require('../models/certificate');
const User = require('../models/user');
// Assuming you have models for these summaries:
const AttendanceSummary = require('../models/analytics'); 
const ReviewSummary = require('../models/analytics');

const generateCode = () => crypto.randomBytes(9).toString('hex').toUpperCase();

async function checkEligibility(req, res, next) {
  try {
    const { programId } = req.query;
    // Aggregation to mimic the LEFT JOIN logic
    const interns = await User.aggregate([
      { $match: { programId: mongoose.Types.ObjectId(programId) } }, // Or filter by program membership
      { $lookup: { from: 'attendance_summaries', localField: '_id', foreignField: 'userId', as: 'a' } },
      { $lookup: { from: 'review_summaries', localField: '_id', foreignField: 'userId', as: 'r' } },
      { $lookup: { from: 'certificates', let: { uid: '$_id' }, pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$internId', '$$uid'] }, { $eq: ['$programId', mongoose.Types.ObjectId(programId)] }] } } }
        ], as: 'c' } 
      }
    ]);
    res.json({ interns });
  } catch (err) { next(err); }
}

async function issueCertificate(req, res, next) {
  try {
    const { internId, programId } = req.body;
    
    // Fetch stats
    const [att, rev] = await Promise.all([
      AttendanceSummary.findOne({ userId: internId }),
      ReviewSummary.findOne({ userId: internId })
    ]);

    const cert = await Certificate.findOneAndUpdate(
      { internId, programId },
      { 
        certificateCode: generateCode(),
        attendancePct: att?.attendancePct || 0,
        avgScore: rev?.avgScore || 0,
        issuedBy: req.user.id,
        issuedAt: new Date()
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
    res.json({ valid: true, certificate: cert });
  } catch (err) { next(err); }
}
async function listMyCertificates(req, res, next) {
  try {
    const certs = await Certificate.find({ internId: req.user.id })
      .populate('programId', 'name');
    res.json({ certificates: certs });
  } catch (err) { next(err); }
}
module.exports = { checkEligibility, issueCertificate, verifyCertificate,listMyCertificates};