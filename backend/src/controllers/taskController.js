const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const User = require('../models/User');

function serializeTask(task, { assignmentCount = null, submissionCount = null } = {}) {
  return {
    id: task._id,
    title: task.title,
    description: task.description ?? null,
    program_id: task.programId?._id ?? task.programId ?? null,
    program_name: task.programId?.name ?? null,
    due_date: task.dueDate ?? null,
    created_at: task.createdAt ?? null,
    assignment_count: assignmentCount,
    submission_count: submissionCount,
  };
}

// Flattens a TaskAssignment (optionally populated with taskId/programId/internId)
// into the shape the frontend expects, whether it's being viewed from the
// intern's "my tasks" list or the mentor/admin submission review list.
function serializeAssignment(a) {
  const task = a.taskId && typeof a.taskId === 'object' ? a.taskId : null;
  const intern = a.internId && typeof a.internId === 'object' ? a.internId : null;
  const submission = a.submission || {};
  const review = submission.review || {};

  return {
    assignment_id: a._id,
    task_id: task?._id ?? a.taskId,
    title: task?.title ?? null,
    description: task?.description ?? null,
    program_name: task?.programId?.name ?? null,
    due_date: task?.dueDate ?? null,
    intern_id: intern?._id ?? a.internId,
    intern_name: intern?.name ?? null,
    email: intern?.email ?? null,
    status: a.status,
    content_url: submission.contentUrl ?? null,
    submission_notes: submission.notes ?? null,
    submission_id: a._id,
    review_id: review.reviewedAt ? a._id : null,
    score: review.score ?? null,
    feedback: review.feedback ?? null,
  };
}

async function createTask(req, res, next) {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user.id });
    if (req.body.internIds) {
      const assignments = req.body.internIds.map(internId => ({ taskId: task._id, internId }));
      await TaskAssignment.insertMany(assignments);
    }
    res.status(201).json({ task: serializeTask(task, { assignmentCount: req.body.internIds?.length ?? 0, submissionCount: 0 }) });
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

    const tasks = await Task.find(filter).populate('programId', 'name').sort('-createdAt');
    const taskIds = tasks.map(t => t._id);
    const assignments = await TaskAssignment.find({ taskId: { $in: taskIds } });

    const counts = {};
    for (const a of assignments) {
      const key = String(a.taskId);
      counts[key] = counts[key] || { assigned: 0, submitted: 0 };
      counts[key].assigned += 1;
      if (a.status !== 'assigned') counts[key].submitted += 1;
    }

    res.json({
      tasks: tasks.map((t) => {
        const c = counts[String(t._id)] || { assigned: 0, submitted: 0 };
        return serializeTask(t, { assignmentCount: c.assigned, submissionCount: c.submitted });
      }),
    });
  } catch (err) { next(err); }
}

async function listMyTasks(req, res, next) {
  try {
    const assignments = await TaskAssignment.find({ internId: req.user.id })
      .populate({
        path: 'taskId',
        populate: { path: 'programId', select: 'name' },
      })
      .sort('-_id');
    res.json({ tasks: assignments.map(serializeAssignment) });
  } catch (err) { next(err); }
}

async function getTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id).populate('programId', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const assignments = await TaskAssignment.find({ taskId: req.params.id })
      .populate('internId', 'name email');

    res.json({ task: serializeTask(task), assignments: assignments.map(serializeAssignment) });
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
    ).populate({ path: 'taskId', populate: { path: 'programId', select: 'name' } });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    res.json({ assignment: serializeAssignment(assignment) });
  } catch (err) { next(err); }
}

async function reviewSubmission(req, res, next) {
  try {
    const { score, feedback, approve } = req.body;
    const assignment = await TaskAssignment.findByIdAndUpdate(
      req.params.submissionId,
      {
        status: approve ? 'approved' : 'needs_revision',
        'submission.review': { score, feedback, reviewedAt: new Date(), reviewerId: req.user.id }
      },
      { new: true }
    ).populate('internId', 'name email');
    if (!assignment) return res.status(404).json({ message: 'Submission not found.' });
    res.json({ assignment: serializeAssignment(assignment) });
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