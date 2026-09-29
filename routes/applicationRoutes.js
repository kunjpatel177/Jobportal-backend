const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getMyApplications,
  getApplicationById,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, applyForJob)
  .get(protect, getMyApplications);

router.route('/:id')
  .get(protect, getApplicationById);

router.route('/:id/status')
  .patch(protect, updateApplicationStatus);

module.exports = router;
