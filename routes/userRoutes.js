const express = require('express');
const router = express.Router();
const {
  uploadUserResume,
  getCurrentUserResume,
  getResumeById
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const uploadResume = require('../middleware/uploadMiddleware');

// Upload and fetch current candidate resume
router
  .route('/resume')
  .post(protect, uploadResume.single('resume'), uploadUserResume)
  .get(protect, getCurrentUserResume);

// Stream resume document (accessible to browser new tab)
router.get('/:id/resume', getResumeById);
router.get('/:id/resume/:filename', getResumeById);

module.exports = router;
