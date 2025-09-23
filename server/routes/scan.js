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
  getScanBookings,
  getAvailableDatesForScanType
} = require('../controllers/scan');
const {
  getScanTypes: getAllScanTypes,
  createScanType,
  updateScanType,
  deleteScanType
} = require('../controllers/scanType');
const { protectWithFallback } = require('../middleware/keycloakAuth');
const { adminOnly, bookerOnly } = require('../middleware/roleAuth');

const router = express.Router();

// Scan types route (accessible to all users - no authentication required)
router.get('/types', getScanTypes);

// User booking routes
// Allow anonymous booking and viewing of weekly scans so public users can
// view available slots and submit bookings without authentication.
router.post('/:id/book', bookScan);
router.get('/my-bookings', protectWithFallback, bookerOnly, getUserBookings);

// User can view weekly scans (for booking purposes)
router.get('/week/:date', getWeeklyScans);

// Get available dates for a specific scan type (public access)
router.get('/available-dates/:scanType', getAvailableDatesForScanType);

// Admin booking management routes
router.get('/bookings/:id', protectWithFallback, adminOnly, getBookingDetails);
router.get('/:id/bookings', protectWithFallback, adminOnly, getScanBookings);

// Scan type management routes (admin only)
router.get('/scan-types', protectWithFallback, adminOnly, getAllScanTypes);
router.post('/scan-types', protectWithFallback, adminOnly, createScanType);
router.put('/scan-types/:id', protectWithFallback, adminOnly, updateScanType);
router.delete('/scan-types/:id', protectWithFallback, adminOnly, deleteScanType);

// Admin-only routes
router.post('/', protectWithFallback, adminOnly, createScan);
router.get('/', protectWithFallback, adminOnly, getScans);
router.put('/:id', protectWithFallback, adminOnly, updateScan);
router.delete('/:id', protectWithFallback, adminOnly, deleteScan);

module.exports = router;
