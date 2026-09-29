const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true
    },
    requirements: {
      type: [String],
      required: [true, 'Job requirements are required'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'At least one requirement is required'
      }
    },
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Job', jobSchema);
