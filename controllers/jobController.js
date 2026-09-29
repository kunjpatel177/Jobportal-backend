const mongoose = require('mongoose');
const Job = require('../models/Job');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get all jobs (sorted newest first)
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Jobs retrieved successfully', {
      jobs,
      count: jobs.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, 'Job not found');
    }

    const job = await Job.findById(id);
    if (!job) {
      return sendError(res, 404, 'Job not found');
    }

    return sendSuccess(res, 200, 'Job retrieved successfully', { job });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Public / Admin
const createJob = async (req, res, next) => {
  try {
    const { title, company, location, description, requirements } = req.body;

    if (!title || !company || !location || !description || !requirements) {
      return sendError(
        res,
        400,
        'Please provide title, company, location, description, and requirements'
      );
    }

    let parsedRequirements = requirements;
    if (typeof requirements === 'string') {
      parsedRequirements = requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);
    }

    if (!Array.isArray(parsedRequirements) || parsedRequirements.length === 0) {
      return sendError(res, 400, 'At least one requirement is required');
    }

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      description: description.trim(),
      requirements: parsedRequirements
    });

    return sendSuccess(res, 201, 'Job created successfully', { job });
  } catch (error) {
    next(error);
  }
};

// @desc    Update job status (Open / Closed)
// @route   PATCH /api/jobs/:id/status
// @access  Private
const updateJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, 'Job not found');
    }

    if (!status || !['Open', 'Closed'].includes(status)) {
      return sendError(res, 400, 'Status must be either "Open" or "Closed"');
    }

    const job = await Job.findById(id);
    if (!job) {
      return sendError(res, 404, 'Job not found');
    }

    job.status = status;
    await job.save();

    return sendSuccess(res, 200, `Job status updated to ${status}`, { job });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJobStatus
};

