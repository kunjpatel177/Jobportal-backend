const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Upload or update user resume
// @route   POST /api/users/resume
// @access  Private
const uploadUserResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Please select a valid resume file (PDF, DOC, or DOCX)');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // If an existing resume file exists on disk, clean it up
    if (user.resume) {
      const oldFilePath = path.join(__dirname, '..', user.resume);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (cleanupErr) {
          console.error(`Failed to remove old resume: ${cleanupErr.message}`);
        }
      }
    }

    // Relative web-accessible path
    const resumePath = `/uploads/resumes/${req.file.filename}`;
    user.resume = resumePath;
    await user.save();

    return sendSuccess(
      res,
      200,
      'Resume uploaded successfully',
      {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        resumeUrl: resumePath,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          resume: user.resume
        }
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadUserResume
};
