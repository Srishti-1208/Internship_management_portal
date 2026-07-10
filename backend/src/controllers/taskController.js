const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const User = require('../models/User');

async function createTask(req, res, next) {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user.id });
    if (req.body.internIds) {
      const assignments = req.body.internIds.map(internId => ({ taskId: task._id, internId }));
      await TaskAssignment.insertMany(assignments);
    }
    res.status(201).json({ task });
  } catch (err) { next(err); }
}

async function listTasks(req, res, next) {
  try {
    const { programId } = req.query;
    let filter = programId ? { programId } : {};
    
    // Mentor filtering logic
    if (req.user.role === 'mentor') {
      const myInterns = await User.find({ mentorId: req.user.id }).select('_id');
      const assignedTasks = await TaskAssignment.find({ internId: { $in: myInterns } }).select('taskId');
      filter._id = { $in: assignedTasks.map(t => t.taskId) };
    }
    
    const tasks = await Task.find(filter).sort('-createdAt');
    res.json({ tasks });
  } catch (err) { next(err); }
}

async function listMyTasks(req, res, next) {
  try {
    const assignments = await TaskAssignment.find({ internId: req.user.id })
      .populate({
        path: 'taskId',
        populate: { path: 'programId' }
      });
    res.json({ tasks: assignments });
  } catch (err) { next(err); }
}

async function getTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id).populate('programId');
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    
    const assignments = await TaskAssignment.find({ taskId: req.params.id })
      .populate('internId', 'name email');
      
    res.json({ task, assignments });
  } catch (err) { next(err); }
}

async function assignTask(req, res, next) {
  try {
    const assignments = req.body.internIds.map(internId => ({ 
      taskId: req.params.id, 
      internId 
    }));
    await TaskAssignment.insertMany(assignments, { ordered: false }).catch(() => {});
    res.status(201).json({ message: 'Assignments processed.' });
  } catch (err) { next(err); }
}

async function submitWork(req, res, next) {
  try {
    const { contentUrl, notes } = req.body;
    const assignment = await TaskAssignment.findOneAndUpdate(
      { _id: req.params.assignmentId, internId: req.user.id },
      { 
        status: 'submitted',
        submission: { contentUrl, notes, submittedAt: new Date() }
      },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    res.json({ assignment });
  } catch (err) { next(err); }
}

async function reviewSubmission(req, res, next) {
  try {
    const { score, feedback, approve } = req.body;
    const assignment = await TaskAssignment.findByIdAndUpdate(
      req.params.assignmentId,
      {
        status: approve ? 'approved' : 'needs_revision',
        'submission.review': { score, feedback, reviewedAt: new Date(), reviewerId: req.user.id }
      },
      { new: true }
    );
    res.json({ assignment });
  } catch (err) { next(err); }
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