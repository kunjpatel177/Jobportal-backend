const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJobStatus
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(getJobs)
  .post(createJob);

router.route('/:id')
  .get(getJobById);

router.route('/:id/status')
  .patch(protect, updateJobStatus);

module.exports = router;
