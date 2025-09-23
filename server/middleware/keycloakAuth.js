const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const jwkToPem = require('jwk-to-pem');

// Cache for Keycloak public keys
let publicKeys = null;
let publicKeysExpiry = null;

// Fetch Keycloak public keys
const fetchKeycloakPublicKeys = async () => {
  try {
    const url = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Keycloak public keys');
    }
    
    const data = await response.json();
    
    // Cache the keys for 1 hour
    publicKeys = data.keys;
    publicKeysExpiry = Date.now() + (60 * 60 * 1000);
    
    return data.keys;
  } catch (error) {
    console.error('Error fetching Keycloak public keys:', error);
    throw error;
  }
};

// Get Keycloak public keys (with caching)
const getKeycloakPublicKeys = async () => {
  if (publicKeys && publicKeysExpiry && Date.now() < publicKeysExpiry) {
    return publicKeys;
  }
  
  return await fetchKeycloakPublicKeys();
};

// Verify Keycloak token
const verifyKeycloakToken = async (token) => {
  try {
    // Decode token header to get the kid (key id)
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header.kid) {
      throw new Error('Invalid token format');
    }
    
    // Get public keys from Keycloak
    const keys = await getKeycloakPublicKeys();
    const key = keys.find(k => k.kid === decodedHeader.header.kid);
    
    if (!key) {
      throw new Error('Public key not found');
    }
    
    // Convert JWK to PEM format
    const publicKey = jwkToPem(key);
    
    // Verify token
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      audience: process.env.KEYCLOAK_CLIENT_ID,
      issuer: `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}`
    });
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Protect routes with Keycloak authentication
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify Keycloak token
    const decoded = await verifyKeycloakToken(token);
    
    // Extract user information from token
    req.user = {
      id: decoded.sub,
      username: decoded.preferred_username,
      email: decoded.email,
      firstName: decoded.given_name,
      lastName: decoded.family_name,
      name: decoded.name,
      roles: [
        ...(decoded.realm_access?.roles || []),
        ...(decoded.resource_access?.[process.env.KEYCLOAK_CLIENT_ID]?.roles || [])
      ]
    };

    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Alternative protection method that falls back to JWT for compatibility
exports.protectWithFallback = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // First try Keycloak token verification
    try {
      const decoded = await verifyKeycloakToken(token);
      req.user = {
        id: decoded.sub,
        username: decoded.preferred_username,
        email: decoded.email,
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        name: decoded.name,
        roles: [
          ...(decoded.realm_access?.roles || []),
          ...(decoded.resource_access?.[process.env.KEYCLOAK_CLIENT_ID]?.roles || [])
        ]
      };
      return next();
    } catch (keycloakError) {
      // Fall back to JWT verification for existing users
      const User = require('../models/User');
      const jwtDecoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(jwtDecoded.id);
      return next();
    }
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};