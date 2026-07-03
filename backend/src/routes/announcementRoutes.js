const express = require('express');
const {
  createAnnouncement,
  listAnnouncements,
  deleteAnnouncement,
} = require('../controllers/communicationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listAnnouncements); // all roles can read (query is scoped server-side)
router.post('/', authorize('admin', 'mentor'), createAnnouncement);
router.delete('/:id', authorize('admin', 'mentor'), deleteAnnouncement);

module.exports = router;
