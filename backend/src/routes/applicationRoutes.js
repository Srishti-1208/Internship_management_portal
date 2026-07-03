const express = require('express');
const {
  createApplication,
  listApplications,
  updateApplication,
  onboardApplication,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.post('/', createApplication);
router.get('/', listApplications);
router.put('/:id', updateApplication);
router.post('/:id/onboard', onboardApplication);

module.exports = router;
