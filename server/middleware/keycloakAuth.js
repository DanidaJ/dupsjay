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
    console.log('Fetching public keys from URL:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log('Public key fetch failed - Status:', response.status, response.statusText);
      throw new Error('Failed to fetch Keycloak public keys');
    }
    
    const data = await response.json();
    console.log('Public keys fetched successfully. Key count:', data.keys?.length);
    console.log('First key preview:', data.keys?.[0] ? { kid: data.keys[0].kid, alg: data.keys[0].alg } : 'No keys');
    
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
    console.log('Token header:', decodedHeader?.header);
    if (!decodedHeader || !decodedHeader.header.kid) {
      throw new Error('Invalid token format');
    }
    
    // Get public keys from Keycloak
    const keys = await getKeycloakPublicKeys();
    const key = keys.find(k => k.kid === decodedHeader.header.kid);
    console.log('Looking for key ID:', decodedHeader.header.kid);
    console.log('Available key IDs:', keys.map(k => k.kid));
    
    if (!key) {
      throw new Error('Public key not found');
    }
    
    // Convert JWK to PEM format
    const publicKey = jwkToPem(key);
    console.log('Token verification will try both audiences:', {
      algorithms: ['RS256'],
      primaryAudience: process.env.KEYCLOAK_CLIENT_ID,
      fallbackAudience: 'account',
      issuer: `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}`
    });
    
    // First decode without verification to see the token claims
    const payload = jwt.decode(token);
    console.log('Token payload audience:', payload?.aud);
    console.log('Expected audiences:', [process.env.KEYCLOAK_CLIENT_ID, 'account']);
    console.log('Token issuer:', payload?.iss);
    console.log('Expected issuer:', `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}`);
    
    // Try both possible audiences: client ID first, then 'account' (Keycloak default)
    let decoded;
    let audienceUsed = '';
    
    try {
      // First try with client ID (this is the proper way)
      decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        audience: process.env.KEYCLOAK_CLIENT_ID,
        issuer: `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}`
      });
      audienceUsed = `client ID (${process.env.KEYCLOAK_CLIENT_ID})`;
      console.log('✅ Token verified with client ID as audience - PROPER CONFIGURATION');
    } catch (clientAudError) {
      console.log('❌ Client ID audience failed:', clientAudError.message);
      
      // If that fails, try with 'account' audience (fallback for misconfigured Keycloak)
      try {
        decoded = jwt.verify(token, publicKey, {
          algorithms: ['RS256'],
          audience: 'account',
          issuer: `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}`
        });
        audienceUsed = 'account (fallback)';
        console.log('⚠️  Token verified with "account" as audience - KEYCLOAK NEEDS CONFIGURATION');
      } catch (accountAudError) {
        throw new Error(`Token verification failed with both audiences: ${clientAudError.message} | ${accountAudError.message}`);
      }
    }
    
    console.log(`Token verified successfully using audience: ${audienceUsed}`);
    
    return decoded;
  } catch (error) {
    console.log('Token verification error:', error.message);
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

  console.log('=== KEYCLOAK AUTH DEBUG ===');
  console.log('Request path:', req.path);
  console.log('Token present:', !!token);
  console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'None');

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // First try Keycloak token verification
    try {
      console.log('Attempting Keycloak token verification...');
      const decoded = await verifyKeycloakToken(token);
      console.log('Keycloak token verified successfully');
      console.log('User info:', {
        id: decoded.sub,
        username: decoded.preferred_username,
        email: decoded.email,
        roles: [
          ...(decoded.realm_access?.roles || []),
          ...(decoded.resource_access?.[process.env.KEYCLOAK_CLIENT_ID]?.roles || [])
        ]
      });
      
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
      console.log('=== END KEYCLOAK AUTH DEBUG ===');
      return next();
    } catch (keycloakError) {
      console.log('❌ Keycloak authentication failed:', keycloakError.message);
      console.log('=== END KEYCLOAK AUTH DEBUG ===');
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Keycloak token'
      });
    }
  } catch (err) {
    console.log('Both Keycloak and JWT verification failed:', err.message);
    console.log('=== END KEYCLOAK AUTH DEBUG ===');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};