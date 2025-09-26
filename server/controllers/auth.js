const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const fetch = require('node-fetch');

// @desc    Register user via Keycloak's registration endpoint
// @route   POST /api/auth/keycloak-register
// @access  Public
const keycloakRegister = asyncHandler(async (req, res, next) => {
  const { username, email, firstName, lastName, password, role } = req.body;

  // Validate required fields
  if (!username || !email || !firstName || !lastName || !password) {
    return next(new ErrorResponse('Please provide all required fields: username, email, firstName, lastName, password', 400));
  }

  try {
    // Use Keycloak's registration endpoint directly (no admin credentials needed)
    const keycloakRegistrationUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/registrations`;
    
    // Prepare registration data
    const registrationData = {
      username,
      email,
      firstName,
      lastName,
      enabled: true,
      emailVerified: false,
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false
        }
      ]
    };

    // If role is specified, we'll try to assign it after registration
    // For now, we'll use a different approach - self-registration through Keycloak's public endpoint
    
    // Since Keycloak's admin API requires admin credentials, we'll use a different approach
    // We'll create a user registration form that works with Keycloak's self-registration
    
    // Alternative approach: Use Keycloak's direct registration if enabled in your realm
    // Or create a temporary user record and let Keycloak handle the actual user creation on first login
    
    // For this implementation, we'll simulate a successful registration
    // and let the user be created on first login through Keycloak's standard flow
    
    // In a real-world scenario, you might want to:
    // 1. Enable self-registration in Keycloak realm settings
    // 2. Use Keycloak's REST API with proper admin credentials
    // 3. Or implement a custom registration flow
    
    // For now, let's create a simple endpoint that validates the data
    // and returns success, allowing the frontend to proceed with login
    
    res.status(201).json({
      success: true,
      message: 'Registration data received. Please proceed to login with your credentials.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return next(new ErrorResponse('Registration failed. Please try again.', 500));
  }
});

// Alternative implementation using Keycloak Admin Client (requires admin credentials)
const keycloakRegisterWithAdmin = asyncHandler(async (req, res, next) => {
  const { username, email, firstName, lastName, password, role } = req.body;

  // Validate required fields
  if (!username || !email || !firstName || !lastName || !password) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  try {
    const KcAdminClient = require('@keycloak/keycloak-admin-client').default;
    
    const kcAdmin = new KcAdminClient({
      baseUrl: process.env.KEYCLOAK_AUTH_SERVER_URL,
      realmName: process.env.KEYCLOAK_REALM,
    });

    // Authenticate with Keycloak admin (would need admin credentials)
    await kcAdmin.auth({
      username: process.env.KEYCLOAK_ADMIN_USERNAME,
      password: process.env.KEYCLOAK_ADMIN_PASSWORD,
      grantType: 'password',
      clientId: 'admin-cli',
    });

    // Create user
    const user = await kcAdmin.users.create({
      username,
      email,
      firstName,
      lastName,
      enabled: true,
      emailVerified: false,
    });

    // Set password
    if (user.id) {
      await kcAdmin.users.resetPassword({
        id: user.id,
        credential: {
          temporary: false,
          type: 'password',
          value: password,
        },
      });

      // Assign role if specified
      if (role) {
        const clientRoles = await kcAdmin.clients.listRoles({
          id: process.env.KEYCLOAK_CLIENT_UUID, // You'd need the client UUID
        });
        
        const roleObj = clientRoles.find(r => r.name === role);
        if (roleObj) {
          await kcAdmin.users.addClientRoleMappings({
            id: user.id,
            clientUniqueId: process.env.KEYCLOAK_CLIENT_UUID,
            roles: [roleObj],
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
    });

  } catch (error) {
    console.error('Keycloak registration error:', error);
    
    if (error.response?.status === 409) {
      return next(new ErrorResponse('User already exists', 409));
    }
    
    return next(new ErrorResponse('Registration failed', 500));
  }
});

// Registration endpoint that creates users in Keycloak using client credentials
const simpleKeycloakRegister = asyncHandler(async (req, res, next) => {
  const { username, email, firstName, lastName, password, role } = req.body;

  // Validate required fields
  if (!username || !email || !firstName || !lastName || !password) {
    return next(new ErrorResponse('Please provide all required fields: username, email, firstName, lastName, password', 400));
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorResponse('Please provide a valid email address', 400));
  }

  // Password strength validation
  if (password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters long', 400));
  }

  try {
    // Get access token using client credentials
    const tokenUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Failed to get access token:', errorData);
      return next(new ErrorResponse('Failed to authenticate with Keycloak', 500));
    }

    const { access_token } = await tokenResponse.json();

    // Create user in Keycloak
    const createUserUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`;
    
    const userData = {
      username,
      email,
      firstName,
      lastName,
      enabled: true,
      emailVerified: true,
      credentials: [{
        type: 'password',
        value: password,
        temporary: false
      }]
    };

    const createUserResponse = await fetch(createUserUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify(userData)
    });

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.text();
      console.error('Failed to create user in Keycloak:', errorData);
      
      if (createUserResponse.status === 409) {
        return next(new ErrorResponse('User with this username or email already exists', 409));
      }
      
      return next(new ErrorResponse('Failed to create user in Keycloak', 500));
    }

    // Get the created user ID from Location header
    const location = createUserResponse.headers.get('location');
    let userId = null;
    if (location) {
      userId = location.split('/').pop();
    }

    // Assign realm role if specified
    if (userId && role && role !== 'user') {
      try {
        // Get available realm roles
        const rolesUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles`;
        const rolesResponse = await fetch(rolesUrl, {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });

        if (rolesResponse.ok) {
          const roles = await rolesResponse.json();
          const targetRole = roles.find(r => r.name === role);
          
          if (targetRole) {
            // Assign role to user
            const assignRoleUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`;
            const assignRoleResponse = await fetch(assignRoleUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
              },
              body: JSON.stringify([targetRole])
            });

            if (!assignRoleResponse.ok) {
              console.error('Failed to assign role to user');
            }
          } else {
            console.warn(`Role '${role}' not found in realm`);
          }
        }
      } catch (roleError) {
        console.error('Error assigning role:', roleError);
        // Don't fail the registration if role assignment fails
      }
    }

    console.log('User created successfully in Keycloak:', {
      username,
      email,
      firstName,
      lastName,
      role: role || 'user'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully in Keycloak. You can now log in with your credentials.',
      data: {
        username,
        email,
        firstName,
        lastName,
        role: role || 'user'
      }
    });

  } catch (error) {
    console.error('Registration processing error:', error);
    return next(new ErrorResponse('Registration failed. Please try again.', 500));
  }
});

module.exports = {
  keycloakRegister: simpleKeycloakRegister,
  keycloakRegisterWithAdmin
};
