const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private
const applyForJob = async (req, res, next) => {
  try {
    const jobId = req.body.jobId || req.body.job;
    const { coverLetter } = req.body;

    // Validate jobId
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return sendError(res, 400, 'Please provide a valid Job ID');
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return sendError(res, 404, 'Job not found');
    }

    // Check if job is still accepting applications
    if (job.status === 'Closed') {
      return sendError(
        res,
        400,
        'This job position is currently closed and no longer accepting applications'
      );
    }

    // Check if user has uploaded a resume
    if (!req.user.resume || req.user.resume.trim() === '') {
      return sendError(
        res,
        400,
        'Please upload your resume in your profile before applying for this job'
      );
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      user: req.user._id,
      job: jobId
    });

    if (existingApplication) {
      return sendError(res, 409, 'You have already applied for this job');
    }

    // Create application using user's uploaded resume
    const application = await Application.create({
      user: req.user._id,
      job: jobId,
      resume: req.user.resume,
      coverLetter: coverLetter ? coverLetter.trim() : '',
      status: 'Applied',
      appliedAt: new Date()
    });

    // Populate job and user details
    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company location description requirements')
      .populate('user', 'name email resume');

    return sendSuccess(
      res,
      201,
      'Application submitted successfully',
      { application: populatedApplication }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications belonging to logged-in user
// @route   GET /api/applications
// @access  Private
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate('job', 'title company location description requirements')
      .populate('user', 'name email resume')
      .sort({ appliedAt: -1 });

    return sendSuccess(res, 200, 'Applications retrieved successfully', {
      applications,
      count: applications.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get application by ID (Only owner)
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, 'Application not found');
    }

    const application = await Application.findById(id)
      .populate('job', 'title company location description requirements')
      .populate('user', 'name email resume');

    if (!application) {
      return sendError(res, 404, 'Application not found');
    }

    // Ensure user is the owner of this application
    if (application.user._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied. You can only view your own application');
    }

    return sendSuccess(res, 200, 'Application retrieved successfully', {
      application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, 'Application not found');
    }

    const allowedStatuses = [
      'Applied',
      'Under Review',
      'Shortlisted',
      'Rejected',
      'Selected'
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return sendError(
        res,
        400,
        `Invalid status. Status must be one of: ${allowedStatuses.join(', ')}`
      );
    }

    const application = await Application.findById(id);
    if (!application) {
      return sendError(res, 404, 'Application not found');
    }

    application.status = status;
    await application.save();

    const populated = await Application.findById(application._id)
      .populate('job', 'title company location description requirements status')
      .populate('user', 'name email resume');

    return sendSuccess(
      res,
      200,
      `Application status updated to "${status}"`,
      { application: populated }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationById,
  updateApplicationStatus
};

