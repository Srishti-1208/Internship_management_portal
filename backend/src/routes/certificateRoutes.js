const express = require('express');
const {
  checkEligibility,
  issueCertificate,
  listMyCertificates,
  listAllCertificates,
  verifyCertificate,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public — no auth — so anyone with a certificate code can verify it
router.get('/verify/:code', verifyCertificate);

router.use(protect);

// Only mentors issue certificates, and only for their own interns.
router.get('/eligibility', authorize('mentor'), checkEligibility);
router.post('/', authorize('mentor'), issueCertificate);

// Interns view their own certificates.
router.get('/mine', authorize('intern'), listMyCertificates);

// Admin no longer issues certificates, but keeps read-only oversight.
router.get('/all', authorize('admin'), listAllCertificates);

module.exports = router;
