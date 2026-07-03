const express = require('express');
const {
  checkEligibility,
  issueCertificate,
  listMyCertificates,
  verifyCertificate,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public — no auth — so anyone with a certificate code can verify it
router.get('/verify/:code', verifyCertificate);

router.use(protect);

router.get('/eligibility', authorize('admin', 'mentor'), checkEligibility);
router.post('/', authorize('admin'), issueCertificate);
router.get('/mine', authorize('intern'), listMyCertificates);

module.exports = router;
