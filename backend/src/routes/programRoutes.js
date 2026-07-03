const express = require('express');
const {
  createProgram,
  listPrograms,
  getProgram,
  updateProgram,
  deleteProgram,
  addInternToProgram,
  removeInternFromProgram,
  getUnassignedInterns,
  listMentors,
} = require('../controllers/programController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'mentor'), listPrograms);
router.get('/unassigned-interns', authorize('admin'), getUnassignedInterns);
router.get('/mentors/list', authorize('admin'), listMentors);
router.get('/:id', authorize('admin', 'mentor'), getProgram);

router.post('/', authorize('admin'), createProgram);
router.put('/:id', authorize('admin'), updateProgram);
router.delete('/:id', authorize('admin'), deleteProgram);

router.post('/:id/interns', authorize('admin'), addInternToProgram);
router.delete('/:id/interns/:userId', authorize('admin'), removeInternFromProgram);

module.exports = router;
