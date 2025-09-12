const mongoose = require('mongoose');

const scanTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 100
  },
  duration: {
    type: Number,
    required: true,
    min: 5,
    max: 300 // Maximum 5 hours
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
scanTypeSchema.index({ name: 1 });
scanTypeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ScanType', scanTypeSchema);
