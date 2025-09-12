const express = require('express');
const {
  createScan,
  getScans,
  getWeeklyScans,
  updateScan,
  deleteScan,
  getScanTypes,
  bookScan,
  getUserBookings,
  getBookingDetails,
  getScanBookings
} = require('../controllers/scan');
const {
  getScanTypes: getAllScanTypes,
  createScanType,
  updateScanType,
  deleteScanType
} = require('../controllers/scanType');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleAuth');

const router = express.Router();

// Scan types route (accessible to all authenticated users)
router.get('/types', protect, getScanTypes);

// User booking routes
// Allow anonymous booking and viewing of weekly scans so public users can
// view available slots and submit bookings without authentication.
router.post('/:id/book', bookScan);
router.get('/my-bookings', protect, getUserBookings);

// User can view weekly scans (for booking purposes)
router.get('/week/:date', getWeeklyScans);

// Admin booking management routes
router.get('/bookings/:id', protect, adminOnly, getBookingDetails);
router.get('/:id/bookings', protect, adminOnly, getScanBookings);

// Scan type management routes (admin only)
router.get('/scan-types', protect, adminOnly, getAllScanTypes);
router.post('/scan-types', protect, adminOnly, createScanType);
router.put('/scan-types/:id', protect, adminOnly, updateScanType);
router.delete('/scan-types/:id', protect, adminOnly, deleteScanType);

// Admin-only routes
router.post('/', protect, adminOnly, createScan);
router.get('/', protect, adminOnly, getScans);
router.put('/:id', protect, adminOnly, updateScan);
router.delete('/:id', protect, adminOnly, deleteScan);

module.exports = router;
