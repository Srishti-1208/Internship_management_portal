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
      match = { 'interns.user': { $in: myInterns.map(i => i._id) } };
    }
    const programs = await Program.aggregate([
      { $match: match },
      { $addFields: { internCount: { $size: { $ifNull: ["$interns", []] } } } },
      { $sort: { createdAt: -1 } }
    ]);
    res.json({
      programs: programs.map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description ?? null,
        department: p.department ?? null,
        start_date: p.startDate ?? null,
        end_date: p.endDate ?? null,
        status: p.status,
        intern_count: p.internCount,
      })),
    });
  } catch (err) { next(err); }
}

async function getProgram(req, res, next) {
  try {
    const program = await Program.findById(req.params.id).populate({
      path: 'interns.user',
      select: 'name department mentorId',
      populate: { path: 'mentorId', select: 'name' },
    });
    if (!program) return res.status(404).json({ message: 'Program not found.' });

    const interns = program.interns
      .filter((entry) => entry.user) // guard against a dangling ref if a user was deleted
      .map((entry) => ({
        id: entry.user._id,
        name: entry.user.name,
        department: entry.user.department ?? null,
        mentor_name: entry.user.mentorId?.name ?? null,
        joined_at: entry.joinedAt,
      }));

    res.json({
      program: {
        id: program._id,
        name: program.name,
        description: program.description ?? null,
        department: program.department ?? null,
        start_date: program.startDate ?? null,
        end_date: program.endDate ?? null,
        status: program.status,
      },
      interns,
    });
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
    const result = await Program.updateOne(
      { _id: req.params.id, 'interns.user': { $ne: userId } },
      { $push: { interns: { user: userId, joinedAt: new Date() } } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Program not found.' });
    }
    res.status(201).json({ assigned: true });
  } catch (err) { next(err); }
}

async function removeInternFromProgram(req, res, next) {
  try {
    await Program.findByIdAndUpdate(req.params.id, { $pull: { interns: { user: req.params.userId } } });
    res.status(204).send();
  } catch (err) { next(err); }
}

async function getUnassignedInterns(req, res, next) {
  try {
    const prog = await Program.findById(req.query.programId);
    const enrolledIds = (prog?.interns || []).map((entry) => entry.user);
    const interns = await User.find({
      role: 'intern',
      _id: { $nin: enrolledIds }
    }).select('name email department');
    res.json({
      interns: interns.map((i) => ({ id: i._id, name: i.name, email: i.email, department: i.department ?? null })),
    });
  } catch (err) { next(err); }
}

async function listMentors(req, res, next) {
  try {
    const mentors = await User.find({ role: 'mentor' }).select('name email department');
    res.json({
      mentors: mentors.map((m) => ({ id: m._id, name: m.name, email: m.email, department: m.department ?? null })),
    });
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