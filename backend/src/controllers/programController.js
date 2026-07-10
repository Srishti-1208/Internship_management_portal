const Program = require('../models/Program');
const User = require('../models/User');

async function createProgram(req, res, next) {
  try {
    const { name, description, department, startDate, endDate, status } = req.body;
    const program = await Program.create({
      name, description, department, startDate, endDate, status,
      createdBy: req.user.id
    });
    res.status(201).json({ program });
  } catch (err) { next(err); }
}

async function listPrograms(req, res, next) {
  try {
    let match = {};
    if (req.user.role === 'mentor') {
      const myInterns = await User.find({ mentorId: req.user.id }).select('_id');
      match = { interns: { $in: myInterns.map(i => i._id) } };
    }
    const programs = await Program.aggregate([
      { $match: match },
      { $addFields: { internCount: { $size: { $ifNull: ["$interns", []] } } } },
      { $sort: { createdAt: -1 } }
    ]);
    res.json({ programs });
  } catch (err) { next(err); }
}

async function getProgram(req, res, next) {
  try {
    const program = await Program.findById(req.params.id).populate('interns');
    if (!program) return res.status(404).json({ message: 'Program not found.' });
    res.json({ program });
  } catch (err) { next(err); }
}

async function updateProgram(req, res, next) {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!program) return res.status(404).json({ message: 'Program not found.' });
    res.json({ program });
  } catch (err) { next(err); }
}

async function deleteProgram(req, res, next) {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    if (!program) return res.status(404).json({ message: 'Program not found.' });
    res.status(204).send();
  } catch (err) { next(err); }
}

async function addInternToProgram(req, res, next) {
  try {
    const { userId, mentorId } = req.body;
    if (mentorId) await User.findByIdAndUpdate(userId, { mentorId });
    const prog = await Program.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { interns: userId } },
      { new: true }
    );
    res.status(201).json({ assigned: prog });
  } catch (err) { next(err); }
}

async function removeInternFromProgram(req, res, next) {
  try {
    await Program.findByIdAndUpdate(req.params.id, { $pull: { interns: req.params.userId } });
    res.status(204).send();
  } catch (err) { next(err); }
}

async function getUnassignedInterns(req, res, next) {
  try {
    const prog = await Program.findById(req.query.programId);
    const interns = await User.find({
      role: 'intern',
      _id: { $nin: prog?.interns || [] }
    });
    res.json({ interns });
  } catch (err) { next(err); }
}

async function listMentors(req, res, next) {
  try {
    const mentors = await User.find({ role: 'mentor' }).select('name email department');
    res.json({ mentors });
  } catch (err) { next(err); }
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