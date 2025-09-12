const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  getUsers, 
  getUser, 
  updateUserRole, 
  deleteUser 
} = require('../controllers/auth');
const { forgotPassword, resetPassword } = require('../controllers/reset-password');
const { protect } = require('../middleware/auth');
const { authorize, adminOnly } = require('../middleware/roleAuth');

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Admin routes
router.get('/users', protect, adminOnly, getUsers);
router.get('/users/:id', protect, adminOnly, getUser);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
router.delete('/users/:id', protect, adminOnly, deleteUser);

// Password reset routes
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
