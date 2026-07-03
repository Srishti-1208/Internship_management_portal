const express = require('express');
const {
  getOverview,
  getTrend,
  getInternSummary,
  getDepartmentBreakdown,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin', 'mentor'));

router.get('/overview', getOverview);
router.get('/trend', getTrend);
router.get('/interns', getInternSummary);
router.get('/department-breakdown', getDepartmentBreakdown);

module.exports = router;
