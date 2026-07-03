const express = require('express');
const {
  checkIn,
  checkOut,
  getMyAttendance,
  listAttendance,
  updateAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/checkin', authorize('intern'), checkIn);
router.post('/checkout', authorize('intern'), checkOut);
router.get('/me', authorize('intern'), getMyAttendance);

router.get('/', authorize('admin', 'mentor'), listAttendance);
router.put('/:id', authorize('admin', 'mentor'), updateAttendance);

module.exports = router;
