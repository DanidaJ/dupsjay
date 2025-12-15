const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
  scanType: {
    type: String,
    required: [true, 'Please add a scan type'],
    validate: {
      validator: async function(value) {
        const ScanType = mongoose.model('ScanType');
        const scanType = await ScanType.findOne({ name: value });
        return !!scanType;
      },
      message: 'Invalid scan type. Please select a valid scan type from the system.'
    }
  },
  date: {
    type: Date,
    required: [true, 'Please add a date']
  },
  startTime: {
    type: String,
    required: [true, 'Please add a start time'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'Please add an end time'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
  },
  duration: {
    type: Number,
    required: [true, 'Please add duration in minutes']
  },
  totalSlots: {
    type: Number,
    required: [true, 'Please add total number of slots available'],
    min: [1, 'Total slots must be at least 1']
  },
  bookedSlots: {
    type: Number,
    default: 0,
    min: [0, 'Booked slots cannot be negative']
  },
  availableSlots: {
    type: Number,
    default: function() {
      return this.totalSlots - this.bookedSlots;
    }
  },
  bookings: [{
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    bookedAt: {
      type: Date,
      default: Date.now
    },
    patientName: {
      type: String,
      required: true
    },
    patientId: {
      type: String,
      required: true
    },
    notes: String
  }],
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  createdBy: {
    type: String, // Keycloak UUID string instead of MongoDB ObjectId
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate available slots
ScanSchema.pre('save', function(next) {
  this.availableSlots = this.totalSlots - this.bookedSlots;
  next();
});

// Pre-find middleware to calculate available slots for existing documents
ScanSchema.pre(/^find/, function(next) {
  this.lean(false);
  next();
});

// Transform function to ensure availableSlots is always calculated
ScanSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.availableSlots = obj.totalSlots - obj.bookedSlots;
  return obj;
};

// Create compound index to prevent duplicate slots for same scan type, date, and time
ScanSchema.index({ scanType: 1, date: 1, startTime: 1 }, { unique: true });

// Virtual to check if slot is fully booked
ScanSchema.virtual('isFullyBooked').get(function() {
  return this.bookedSlots >= this.totalSlots;
});

// Virtual to get remaining slots
ScanSchema.virtual('remainingSlots').get(function() {
  return Math.max(0, this.totalSlots - this.bookedSlots);
});

// Method to check if slot has availability
ScanSchema.methods.hasAvailability = function() {
  return this.bookedSlots < this.totalSlots;
};

// Method to book a slot
ScanSchema.methods.bookSlot = function(userId, patientName, patientId, notes = '') {
  if (!this.hasAvailability()) {
    throw new Error('No available slots');
  }
  
  this.bookings.push({
    userId,
    patientName,
    patientId,
    notes
  });
  
  this.bookedSlots += 1;
  return this.save();
};

// Method to cancel a booking
ScanSchema.methods.cancelBooking = function(bookingId) {
  const booking = this.bookings.id(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  booking.remove();
  this.bookedSlots = Math.max(0, this.bookedSlots - 1);
  return this.save();
};

// Static method to find available slots
ScanSchema.statics.findAvailable = function(scanType = null, date = null) {
  let query = { $expr: { $gt: ['$totalSlots', '$bookedSlots'] } };
  
  if (scanType) query.scanType = scanType;
  if (date) query.date = date;
  
  return this.find(query);
};

module.exports = mongoose.model('Scan', ScanSchema);
