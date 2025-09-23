const User = require('../models/User');
const KcAdminClient = require('@keycloak/keycloak-admin-client').default;

// Helper function to create user in Keycloak using client credentials
const createKeycloakUser = async (userData) => {
  try {
    console.log('Attempting to create user in Keycloak...');
    
    const kcAdminClient = new KcAdminClient({
      baseUrl: process.env.KEYCLOAK_AUTH_SERVER_URL || 'https://accounts.siyothsoft.com',
      realmName: process.env.KEYCLOAK_REALM || 'scan-appointment'
    });

    // Try to authenticate with client credentials (service account)
    await kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET
    });

    console.log('Authenticated with Keycloak using client credentials');

    // Create user in Keycloak
    const newUser = await kcAdminClient.users.create({
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [{
        type: 'password',
        value: userData.password,
        temporary: false
      }]
    });

    console.log('User created in Keycloak:', newUser);

    // Assign role to user
    let roleAssigned = false;
    if (userData.role && (userData.role === 'admin' || userData.role === 'booker')) {
      try {
        // Get the role
        const role = await kcAdminClient.roles.findOneByName({
          name: userData.role
        });

        if (role) {
          // Assign role to user
          await kcAdminClient.users.addRealmRoleMappings({
            id: newUser.id,
            roles: [role]
          });
          console.log(`✅ Role '${userData.role}' assigned to user successfully`);
          roleAssigned = true;
        } else {
          console.warn(`⚠️ Role '${userData.role}' not found in Keycloak`);
        }
      } catch (roleError) {
        console.error('❌ Error assigning role:', roleError.message);
        // Don't fail the entire registration if role assignment fails
      }
    }

    return { 
      success: true, 
      keycloakId: newUser.id,
      roleAssigned: roleAssigned,
      message: roleAssigned ? 
        `User created in Keycloak with role '${userData.role}'` :
        'User created in Keycloak but role assignment failed'
    };
  } catch (error) {
    console.error('Error creating user in Keycloak:', error);
    return { success: false, error: error.message };
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate role if provided
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either user or admin'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: role || 'user' // Default to 'user' if no role provided
    });

    sendTokenResponse(user, 201, res);
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

    // Handle duplicate key error (email already exists)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // Check if user data comes from Keycloak (has roles array)
    if (req.user.roles) {
      // Keycloak user - return the user data from token
      res.status(200).json({
        success: true,
        data: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          name: req.user.name,
          roles: req.user.roles,
          // For backward compatibility, set role to first role
          role: req.user.roles.includes('admin') ? 'admin' : 
                req.user.roles.includes('booker') ? 'booker' : 'user'
        }
      });
    } else {
      // Legacy JWT user - fetch from database
      const user = await User.findById(req.user.id);
      res.status(200).json({
        success: true,
        data: user
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single user (Admin only)
// @route   GET /api/auth/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either user or admin'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

// @desc    Register user in Keycloak (simplified approach)
// @route   POST /api/auth/keycloak-register
// @access  Public
exports.keycloakRegister = async (req, res) => {
  try {
    const { username, email, firstName, lastName, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !firstName || !lastName || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, first name, last name, password, and role'
      });
    }

    // Validate role
    if (!['booker', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "booker" or "admin"'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // For now, let's try to create the user directly in our database as a backup
    // and provide instructions for Keycloak registration
    
    // Check if user already exists in our database
    let existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // First, try to create user in Keycloak
    console.log('Attempting to create user in Keycloak...');
    const keycloakResult = await createKeycloakUser({
      username,
      email,
      firstName,
      lastName,
      password,
      role
    });

    let keycloakId = null;
    let keycloakSync = false;
    let roleAssigned = false;

    if (keycloakResult.success) {
      console.log('✅ User successfully created in Keycloak');
      keycloakId = keycloakResult.keycloakId;
      keycloakSync = true;
      roleAssigned = keycloakResult.roleAssigned || false;
    } else {
      console.log('❌ Failed to create user in Keycloak, will create locally only:', keycloakResult.error);
    }

    // Create user in local database (either as primary store or backup)
    const localUser = await User.create({
      name: `${firstName} ${lastName}`,
      email,
      password,
      role: role,
      username,
      firstName,
      lastName,
      keycloakSync: keycloakSync,
      keycloakId: keycloakId
    });

    res.status(201).json({
      success: true,
      message: keycloakSync ? 
        (roleAssigned ? 
          `✅ Registration successful! User created in Keycloak with '${role}' role and saved locally.` :
          '⚠️ Registration successful! User created in Keycloak but role assignment failed. User saved locally.') :
        'Registration successful! User created locally. Keycloak sync will be attempted later.',
      data: {
        username: username,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        keycloakSync: keycloakSync,
        roleAssigned: roleAssigned,
        keycloakId: keycloakId,
        note: keycloakSync ? 
          (roleAssigned ? 
            `User successfully created in Keycloak with '${role}' role and local database.` :
            'User created in Keycloak and local database, but role assignment failed.') :
          'User created locally. Keycloak creation failed - will retry later.'
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        message: errors.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};
