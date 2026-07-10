const Announcement = require('../models/Announcement');
const TaskComment = require('../models/TaskComment');
const TaskAssignment = require('../models/TaskAssignment');
const Program = require('../models/Program');

function serializeAnnouncement(a) {
  return {
    id: a._id,
    title: a.title,
    body: a.body,
    author_id: a.authorId?._id ?? a.authorId,
    author_name: a.authorId?.name ?? null,
    program_id: a.programId?._id ?? a.programId ?? null,
    program_name: a.programId?.name ?? null,
    created_at: a.createdAt,
  };
}

async function listAnnouncements(req, res, next) {
  try {
    let filter = {};
    if (req.user.role === 'intern') {
      // Find programs this intern is enrolled in (Program.interns is an embedded array of user IDs)
      const enrolledPrograms = await Program.find({ interns: req.user.id }).select('_id');
      const pIds = enrolledPrograms.map(p => p._id);
      filter.$or = [{ programId: null }, { programId: { $in: pIds } }];
    } else if (req.query.programId) {
      filter.$or = [{ programId: null }, { programId: req.query.programId }];
    }

    const announcements = await Announcement.find(filter)
      .populate('authorId', 'name')
      .populate('programId', 'name')
      .sort('-createdAt');
    res.json({ announcements: announcements.map(serializeAnnouncement) });
  } catch (err) { next(err); }
}

async function createAnnouncement(req, res, next) {
  try {
    const { programId, title, body } = req.body;
    let announcement = await Announcement.create({
      programId: programId || null,
      authorId: req.user.id,
      title,
      body
    });
    announcement = await announcement.populate([{ path: 'authorId', select: 'name' }, { path: 'programId', select: 'name' }]);
    res.status(201).json({ announcement: serializeAnnouncement(announcement) });
  } catch (err) { next(err); }
}

async function deleteAnnouncement(req, res, next) {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role === 'mentor') filter.authorId = req.user.id;

    const announcement = await Announcement.findOneAndDelete(filter);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
    res.status(204).send();
  } catch (err) { next(err); }
}

async function listComments(req, res, next) {
  try {
    if (!(await userCanAccessTask(req.user, req.params.taskId)))
      return res.status(403).json({ message: 'Access denied.' });

    const comments = await TaskComment.find({ taskId: req.params.taskId })
      .populate('authorId', 'name role')
      .sort('createdAt');
    res.json({ comments });
  } catch (err) { next(err); }
}

async function userCanAccessTask(user, taskId) {
  if (user.role === 'admin') return true;
  const filter = { taskId };
  if (user.role === 'mentor') {
    const assignment = await TaskAssignment.findOne(filter).populate('internId');
    return assignment?.internId?.mentorId?.toString() === user.id.toString();
  }
  return !!(await TaskAssignment.findOne({ ...filter, internId: user.id }));
}

async function addComment(req, res, next) {
  try {
    if (!(await userCanAccessTask(req.user, req.params.taskId)))
      return res.status(403).json({ message: 'Access denied.' });

    const comment = await TaskComment.create({
      taskId: req.params.taskId,
      authorId: req.user.id,
      body: req.body.body
    });
    res.status(201).json({ comment });
  } catch (err) { next(err); }
}

module.exports = { createAnnouncement, listAnnouncements, deleteAnnouncement, addComment, listComments };