const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  getUsers, 
  getUser, 
  updateUserRole, 
  deleteUser,
  keycloakRegister
} = require('../controllers/auth');
const { forgotPassword, resetPassword } = require('../controllers/reset-password');
const { protectWithFallback } = require('../middleware/keycloakAuth');
const { authorize, adminOnly } = require('../middleware/roleAuth');

const router = express.Router();

// Auth routes (legacy support - Keycloak handles auth now)
router.post('/register', register);
router.post('/keycloak-register', keycloakRegister);
router.post('/login', login);
router.get('/me', protectWithFallback, getMe);

// Admin routes
router.get('/users', protectWithFallback, adminOnly, getUsers);
router.get('/users/:id', protectWithFallback, adminOnly, getUser);
router.put('/users/:id/role', protectWithFallback, adminOnly, updateUserRole);
router.delete('/users/:id', protectWithFallback, adminOnly, deleteUser);

// Password reset routes (may not be needed with Keycloak)
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
