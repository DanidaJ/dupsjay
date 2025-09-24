const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  // Reference to the scan slot
  scanId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Scan',
    required: true
  },
  
  // Scan details (denormalized for easier querying and history)
  scanType: {
    type: String,
    required: true
  },
  scanDate: {
    type: Date,
    required: true
  },
  slotStartTime: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
  },
  slotEndTime: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
  },
  duration: {
    type: Number,
    required: true
  },
  slotNumber: {
    type: Number,
    required: true
  },
  
  // Patient details
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    maxlength: [100, 'Patient name cannot be more than 100 characters']
  },
  patientPhone: {
    type: String,
    required: [true, 'Patient phone is required'],
    trim: true,
    match: [/^[\d\s\-\+\(\)]{10,}$/, 'Please provide a valid phone number']
  },
  
  // Optional user reference (Keycloak UUID for authenticated users, null for anonymous bookings)
  userId: {
    type: String,
    default: null
  },
  
  // Booker details (person who made the booking - could be different from patient)
  bookerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Booker name cannot be more than 100 characters']
  },
  bookerUserId: {
    type: String,
    default: null
  },
  
  // Booking details
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  
  // Timestamps
  bookedAt: {
    type: Date,
    default: Date.now
  },
  
  // For tracking anonymous vs registered users
  isAnonymous: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to set isAnonymous based on userId
BookingSchema.pre('save', function(next) {
  this.isAnonymous = !this.userId;
  next();
});

// Index for efficient queries
BookingSchema.index({ scanId: 1, slotNumber: 1 }, { unique: true });
BookingSchema.index({ scanDate: 1 });
BookingSchema.index({ userId: 1 });
BookingSchema.index({ patientPhone: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
