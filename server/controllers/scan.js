const Scan = require('../models/Scan');
const ScanType = require('../models/ScanType');
const Booking = require('../models/Booking');

// @desc    Create new scan slot
// @route   POST /api/scans
// @access  Private/Admin
exports.createScan = async (req, res) => {
  try {
    const { scanType, date, startTime, endTime, duration, totalSlots, notes } = req.body;

    // Validate required fields
    if (!scanType || !date || !startTime || !endTime || !duration || !totalSlots) {
      return res.status(400).json({
        success: false,
        message: 'Please provide scan type, date, start time, end time, duration, and total slots'
      });
    }

    // Validate scan type
    const validScanType = await ScanType.findOne({ name: scanType });
    if (!validScanType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scan type. Please select a valid scan type from the system.'
      });
    }

    // Validate total slots
    if (totalSlots < 1 || totalSlots > 50) {
      return res.status(400).json({
        success: false,
        message: 'Total slots must be between 1 and 50'
      });
    }

    // Validate date (must be today or future)
    const scanDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scanDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule scans for past dates'
      });
    }

    // Validate time format and logic
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM format'
      });
    }

    // Check if start time is before end time
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time'
      });
    }

    // Check for conflicts with existing scans
    const existingScan = await Scan.findOne({
      scanType,
      date: scanDate,
      startTime: startTime
    });

    if (existingScan) {
      return res.status(400).json({
        success: false,
        message: 'A slot for this scan type already exists at this time'
      });
    }

    // Create scan slot
    const scan = await Scan.create({
      scanType,
      date: scanDate,
      startTime,
      endTime,
      duration,
      totalSlots,
      notes,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: scan
    });
  } catch (err) {
    console.error(err.message);
    
    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        message: errors.join('. ')
      });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Slot already exists for this scan type, date, and time'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all scans
// @route   GET /api/scans
// @access  Private/Admin
exports.getScans = async (req, res) => {
  try {
    const { date, week, scanType, available } = req.query;
    let query = {};

    // Filter by specific date
    if (date) {
      const searchDate = new Date(date);
      query.date = searchDate;
    }

    // Filter by week
    if (week) {
      const weekStart = new Date(week);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      query.date = {
        $gte: weekStart,
        $lte: weekEnd
      };
    }

    // Filter by scan type
    if (scanType) {
      query.scanType = scanType;
    }

    // Filter by availability
    if (available === 'true') {
      query.isBooked = false;
    }

    const scans = await Scan.find(query)
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: scans.length,
      data: scans
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get scans for a specific week
// @route   GET /api/scans/week/:date
// @access  Private/Admin
exports.getWeeklyScans = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Parse date in UTC to avoid timezone issues
    const inputDate = new Date(date + 'T00:00:00.000Z');
    
    // Get the start of the week (Monday) - Timezone-safe calculation
    const weekStart = new Date(inputDate);
    const dayOfWeek = weekStart.getUTCDay();
    
    // Calculate days to subtract to get to Monday (using UTC methods)
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setUTCDate(weekStart.getUTCDate() - daysToSubtract);
    weekStart.setUTCHours(0, 0, 0, 0);
    
    // Get the end of the week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    // Debug logging
    console.log('=== WEEK CALCULATION DEBUG ===');
    console.log('Input date:', date);
    console.log('Parsed input date (UTC):', inputDate.toISOString());
    console.log('UTC Day of week:', dayOfWeek);
    console.log('Days to subtract:', daysToSubtract);
    console.log('Calculated week start (UTC):', weekStart.toISOString());
    console.log('Calculated week end (UTC):', weekEnd.toISOString());
    console.log('===============================');

    const scans = await Scan.find({
      date: {
        $gte: weekStart,
        $lte: weekEnd
      }
    })
    .sort({ date: 1, startTime: 1 });

    // Get all bookings for the scans in this week
    const scanIds = scans.map(scan => scan._id);
    const bookings = await Booking.find({
      scanId: { $in: scanIds },
      bookingStatus: 'confirmed'
    });

    // Group bookings by scanId for easier lookup
    const bookingsByScan = {};
    bookings.forEach(booking => {
      const scanId = booking.scanId.toString();
      if (!bookingsByScan[scanId]) {
        bookingsByScan[scanId] = [];
      }
      bookingsByScan[scanId].push(booking);
    });

    // Group scans by day
    const weeklyScans = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach(day => {
      weeklyScans[day] = [];
    });

    scans.forEach(scan => {
      const scanId = scan._id.toString();
      const scanBookings = bookingsByScan[scanId] || [];
      
      // Update booked slots count from actual bookings
      scan.bookedSlots = scanBookings.length;
      scan.availableSlots = scan.totalSlots - scan.bookedSlots;
      
      // Add booking details to scan object for admin users
      const scanWithBookings = {
        ...scan.toObject(),
        bookingDetails: scanBookings.map(booking => ({
          _id: booking._id,
          slotNumber: booking.slotNumber,
          slotStartTime: booking.slotStartTime,
          slotEndTime: booking.slotEndTime,
          patientName: booking.patientName,
          patientPhone: booking.patientPhone,
          bookedAt: booking.bookedAt,
          notes: booking.notes,
          isAnonymous: booking.isAnonymous,
          userId: booking.userId
        }))
      };
      
      const dayIndex = scan.date.getDay();
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Adjust for Monday start
      weeklyScans[dayName].push(scanWithBookings);
    });

    // Log debug information
    console.log('=== WEEKLY SCANS DEBUG ===');
    Object.entries(weeklyScans).forEach(([day, dayScans]) => {
      console.log(`${day}: ${dayScans.length} scans`);
      dayScans.forEach(scan => {
        console.log(`  - ${scan.scanType} at ${scan.startTime}: ${scan.availableSlots}/${scan.totalSlots} available`);
      });
    });
    console.log('==========================');

    res.status(200).json({
      success: true,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      data: weeklyScans
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update scan
// @route   PUT /api/scans/:id
// @access  Private/Admin
exports.updateScan = async (req, res) => {
  try {
    const scan = await Scan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: scan
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete scan slot
// @route   DELETE /api/scans/:id
// @access  Private/Admin
exports.deleteScan = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan slot not found'
      });
    }

    // Don't allow deletion of slots with bookings
    if (scan.bookedSlots > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete slot with ${scan.bookedSlots} booking(s). Cancel all bookings first.`
      });
    }

    await Scan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Scan slot deleted successfully'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get available dates for a specific scan type
// @route   GET /api/scans/available-dates/:scanType
// @access  Public
exports.getAvailableDatesForScanType = async (req, res) => {
  try {
    const { scanType } = req.params;
    const { fromDate } = req.query;
    
    // Set default from date to today if not provided
    const startDate = fromDate ? new Date(fromDate) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    // Get scans for the next 3 months to provide good range
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setHours(23, 59, 59, 999);

    console.log(`=== AVAILABLE DATES DEBUG for ${scanType} ===`);
    console.log('Start date:', startDate.toISOString());
    console.log('End date:', endDate.toISOString());

    // Find all scans for this scan type in the date range
    const scans = await Scan.find({
      scanType: scanType,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1, startTime: 1 });

    // Get bookings for these scans
    const scanIds = scans.map(scan => scan._id);
    const bookings = await Booking.find({
      scanId: { $in: scanIds },
      bookingStatus: 'confirmed'
    });

    // Group bookings by scanId
    const bookingsByScan = {};
    bookings.forEach(booking => {
      const scanId = booking.scanId.toString();
      if (!bookingsByScan[scanId]) {
        bookingsByScan[scanId] = [];
      }
      bookingsByScan[scanId].push(booking);
    });

    // Process scans to get available dates
    const availableDates = [];
    const dateMap = new Map(); // To avoid duplicate dates

    scans.forEach(scan => {
      const scanId = scan._id.toString();
      const scanBookings = bookingsByScan[scanId] || [];
      const availableSlots = scan.totalSlots - scanBookings.length;
      
      if (availableSlots > 0) {
        const dateKey = scan.date.toISOString().split('T')[0];
        
        if (!dateMap.has(dateKey)) {
          const dayName = scan.date.toLocaleDateString('en-US', { weekday: 'long' });
          const formattedDate = scan.date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          dateMap.set(dateKey, {
            date: dateKey,
            displayDate: formattedDate,
            dayName: dayName,
            totalAvailableSlots: availableSlots,
            scans: [{
              _id: scan._id,
              startTime: scan.startTime,
              endTime: scan.endTime,
              availableSlots: availableSlots,
              totalSlots: scan.totalSlots
            }]
          });
        } else {
          // Add this scan to existing date entry
          const existing = dateMap.get(dateKey);
          existing.totalAvailableSlots += availableSlots;
          existing.scans.push({
            _id: scan._id,
            startTime: scan.startTime,
            endTime: scan.endTime,
            availableSlots: availableSlots,
            totalSlots: scan.totalSlots
          });
        }
      }
    });

    // Convert map to array and sort by date
    const sortedDates = Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    console.log(`Found ${sortedDates.length} available dates for ${scanType}`);
    console.log('Available dates:', sortedDates.map(d => d.date));
    console.log('===============================');

    res.status(200).json({
      success: true,
      scanType: scanType,
      fromDate: startDate.toISOString().split('T')[0],
      toDate: endDate.toISOString().split('T')[0],
      data: sortedDates
    });
  } catch (err) {
    console.error('Error fetching available dates:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get scan types
// @route   GET /api/scans/types
// @access  Private
exports.getScanTypes = async (req, res) => {
  try {
    const scanTypes = await ScanType.find().sort({ name: 1 });
    const scanTypeNames = scanTypes.map(type => type.name);

    res.status(200).json({
      success: true,
      data: scanTypeNames
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Book a scan slot
// @route   POST /api/scans/:id/book
// @access  Public (allows anonymous booking)
exports.bookScan = async (req, res) => {
  try {
    const { 
      patientName, 
      patientPhone, 
      notes, 
      slotStartTime, 
      slotEndTime, 
      slotNumber,
      bookerName,
      bookerUserId
    } = req.body;
    const scanId = req.params.id;
    
    // userId is optional (null for anonymous bookings)
    const userId = req.user ? req.user.id : null;

    // Validate required fields
    if (!patientName || !patientPhone || !slotStartTime || !slotEndTime || !slotNumber) {
      return res.status(400).json({
        success: false,
        message: 'Patient name, phone number, slot start time, end time, and slot number are required'
      });
    }

    // Validate phone number format
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(patientPhone.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Find the scan slot
    const scan = await Scan.findById(scanId);
    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan slot not found'
      });
    }

    // Check if scan date is in the future or today
    const scanDate = new Date(scan.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scanDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments for past dates'
      });
    }

    // Check if the specific slot is already booked
    const existingBooking = await Booking.findOne({
      scanId: scanId,
      slotNumber: slotNumber,
      bookingStatus: 'confirmed'
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This specific time slot is already booked'
      });
    }

    // For authenticated users, check if they already have a booking for this scan
    if (userId) {
      const userExistingBooking = await Booking.findOne({
        scanId: scanId,
        userId: userId,
        bookingStatus: 'confirmed'
      });

      if (userExistingBooking) {
        return res.status(400).json({
          success: false,
          message: 'You already have a booking for this scan'
        });
      }
    }

    // Create the booking
    const booking = await Booking.create({
      scanId: scanId,
      scanType: scan.scanType,
      scanDate: scan.date,
      slotStartTime: slotStartTime,
      slotEndTime: slotEndTime,
      duration: scan.duration,
      slotNumber: slotNumber,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      notes: notes?.trim() || '',
      userId: userId,
      bookerName: bookerName?.trim() || (req.user?.name || 'Anonymous User'),
      bookerUserId: bookerUserId || userId,
      isAnonymous: !userId
    });

    // Update the scan's booked slots count
    const totalBookings = await Booking.countDocuments({
      scanId: scanId,
      bookingStatus: 'confirmed'
    });
    
    scan.bookedSlots = totalBookings;
    await scan.save();

    // Booking created successfully

    res.status(200).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        bookingId: booking._id,
        scanId: scan._id,
        scanType: scan.scanType,
        date: scan.date,
        slotStartTime: slotStartTime,
        slotEndTime: slotEndTime,
        slotNumber: slotNumber,
        patientName: patientName,
        patientPhone: patientPhone,
        bookedAt: booking.bookedAt,
        notes: notes,
        isAnonymous: booking.isAnonymous
      }
    });
  } catch (err) {
    console.error('Error in bookScan:', err);
    
    // Handle duplicate booking error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while booking appointment'
    });
  }
};

// @desc    Get user's bookings
// @route   GET /api/scans/my-bookings
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all bookings for the user
    const bookings = await Booking.find({
      userId: userId,
      bookingStatus: 'confirmed'
    })
    .populate('scanId', 'scanType date startTime endTime duration createdBy')
    .sort({ bookedAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get booking details (Admin only)
// @route   GET /api/scans/bookings/:id
// @access  Private/Admin
exports.getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('scanId', 'scanType date startTime endTime duration createdBy')
      .populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all bookings for a scan (Admin only)
// @route   GET /api/scans/:id/bookings
// @access  Private/Admin
exports.getScanBookings = async (req, res) => {
  try {
    const scanId = req.params.id;

    const bookings = await Booking.find({
      scanId: scanId,
      bookingStatus: 'confirmed'
    })
    .populate('userId', 'name email')
    .sort({ slotNumber: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get scans for a specific date
// @route   GET /api/scans/date/:date
// @access  Private/Admin
exports.getScansByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Parse date string (expected format: YYYY-MM-DD)
    const searchDate = new Date(date + 'T00:00:00.000Z');
    
    // Get all scans for this date
    const scans = await Scan.find({
      date: searchDate
    })
    .populate('createdBy', 'name email')
    .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: scans.length,
      data: scans
    });
  } catch (err) {
    console.error('Error fetching scans by date:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all bookings for a specific week
// @route   GET /api/scans/bookings/week/:date
// @access  Private/Admin
exports.getWeeklyBookings = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Parse date in UTC to avoid timezone issues
    const inputDate = new Date(date + 'T00:00:00.000Z');
    
    // Get the start of the week (Monday)
    const weekStart = new Date(inputDate);
    const dayOfWeek = weekStart.getUTCDay();
    
    // Calculate days to subtract to get to Monday (using UTC methods)
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setUTCDate(weekStart.getUTCDate() - daysToSubtract);
    weekStart.setUTCHours(0, 0, 0, 0);
    
    // Get the end of the week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    console.log('=== WEEKLY BOOKINGS DEBUG ===');
    console.log('Input date:', date);
    console.log('Week start (UTC):', weekStart.toISOString());
    console.log('Week end (UTC):', weekEnd.toISOString());

    // Get all bookings for the week
    const bookings = await Booking.find({
      scanDate: {
        $gte: weekStart,
        $lte: weekEnd
      },
      bookingStatus: 'confirmed'
    })
    .sort({ scanDate: 1, slotStartTime: 1 });

    console.log(`Found ${bookings.length} bookings for the week`);
    console.log('==============================');

    res.status(200).json({
      success: true,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    console.error('Error fetching weekly bookings:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

