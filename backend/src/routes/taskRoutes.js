const express = require('express');
const {
  createTask,
  listTasks,
  listMyTasks,
  getTask,
  assignTask,
  submitWork,
  reviewSubmission,
} = require('../controllers/taskController');
const { addComment, listComments } = require('../controllers/communicationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/mine', authorize('intern'), listMyTasks);
router.get('/', authorize('admin', 'mentor'), listTasks);
router.post('/', authorize('admin', 'mentor'), createTask);

router.get('/:id', authorize('admin', 'mentor'), getTask);
router.post('/:id/assign', authorize('admin', 'mentor'), assignTask);

router.get('/:taskId/comments', listComments);
router.post('/:taskId/comments', addComment);

router.post('/assignments/:assignmentId/submit', authorize('intern'), submitWork);
router.post('/submissions/:submissionId/review', authorize('admin', 'mentor'), reviewSubmission);

module.exports = router;
