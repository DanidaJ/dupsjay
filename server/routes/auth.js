const express = require('express');
const {
  keycloakRegister
} = require('../controllers/auth');

const router = express.Router();

// Registration route
router.post('/keycloak-register', keycloakRegister);

module.exports = router;
