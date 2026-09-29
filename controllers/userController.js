const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Upload or update user resume
// @route   POST /api/users/resume
// @access  Private
const uploadUserResume = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return sendError(res, 400, 'Please select a valid resume file (PDF, DOC, or DOCX)');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const safeOriginalName = path
      .basename(req.file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    // 1. Store resume data buffer and metadata in MongoDB
    user.resumeData = {
      data: req.file.buffer,
      contentType: req.file.mimetype || 'application/pdf',
      originalName: safeOriginalName,
      size: req.file.size
    };

    // 2. Set web-accessible relative URL route
    const resumePath = `/api/users/${user._id}/resume/${encodeURIComponent(safeOriginalName)}`;
    user.resume = resumePath;

    // 3. Optional local disk save for local development (skipped gracefully if filesystem is read-only)
    if (!process.env.VERCEL) {
      try {
        const uploadDir = path.join(__dirname, '../uploads/resumes');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const diskFilename = `resume-${user._id}-${Date.now()}-${safeOriginalName}`;
        fs.writeFileSync(path.join(uploadDir, diskFilename), req.file.buffer);
      } catch (diskErr) {
        // Read-only filesystem warning - safe to ignore since buffer is stored in MongoDB
        console.warn('[Disk storage skipped]:', diskErr.message);
      }
    }

    await user.save();

    return sendSuccess(
      res,
      200,
      'Resume uploaded successfully',
      {
        filename: safeOriginalName,
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

// @desc    Get current user's active resume metadata
// @route   GET /api/users/resume
// @access  Private
const getCurrentUserResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || (!user.resume && (!user.resumeData || !user.resumeData.data))) {
      return sendSuccess(res, 200, 'No resume found', {
        hasResume: false,
        resumeUrl: null
      });
    }

    return sendSuccess(res, 200, 'Resume retrieved successfully', {
      hasResume: true,
      resumeUrl: user.resume,
      originalName: user.resumeData?.originalName || 'resume.pdf',
      size: user.resumeData?.size || 0
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stream/download resume by user ID
// @route   GET /api/users/:id/resume or /api/users/:id/resume/:filename
// @access  Public (so browser links and new tabs can open it directly)
const getResumeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // 1. If stored in MongoDB buffer
    if (user.resumeData && user.resumeData.data) {
      const contentType = user.resumeData.contentType || 'application/pdf';
      const filename = user.resumeData.originalName || 'resume.pdf';

      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${filename}"`
      );
      return res.send(user.resumeData.data);
    }

    // 2. Fallback if stored on local disk
    if (user.resume && user.resume.startsWith('/uploads/')) {
      const diskPath = path.join(__dirname, '..', user.resume);
      if (fs.existsSync(diskPath)) {
        return res.sendFile(diskPath);
      }
    }

    return sendError(res, 404, 'Resume document not found for this candidate');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadUserResume,
  getCurrentUserResume,
  getResumeById
};
