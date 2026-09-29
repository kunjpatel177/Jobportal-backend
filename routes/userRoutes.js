const express = require('express');
const router = express.Router();
const { uploadUserResume } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const uploadResume = require('../middleware/uploadMiddleware');

router.post('/resume', protect, uploadResume.single('resume'), uploadUserResume);

module.exports = router;
