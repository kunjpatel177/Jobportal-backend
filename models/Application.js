const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job is required']
    },
    resume: {
      type: String,
      required: [true, 'Resume is required']
    },
    coverLetter: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'],
        message: '{VALUE} is not a supported status'
      },
      default: 'Applied'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate applications by the same user for the same job
applicationSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
