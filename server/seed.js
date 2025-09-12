const mongoose = require('mongoose');
const ScanType = require('./models/ScanType');
const User = require('./models/User');
require('dotenv').config();

const seedScanTypes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create default admin user if it doesn't exist
    const adminUser = await User.findOne({ email: 'admin@dupsjay.com' });
    let adminId;
    
    if (!adminUser) {
      const newAdmin = new User({
        name: 'System Admin',
        email: 'admin@dupsjay.com',
        password: 'admin123',
        role: 'admin'
      });
      await newAdmin.save();
      adminId = newAdmin._id;
      console.log('Default admin user created');
    } else {
      adminId = adminUser._id;
      console.log('Using existing admin user');
    }

    // Default scan types with durations
    const defaultScanTypes = [
      { name: 'CT Scan', duration: 30 },
      { name: 'MRI Scan', duration: 45 },
      { name: 'X-Ray', duration: 15 },
      { name: 'Ultrasound', duration: 20 },
      { name: 'PET Scan', duration: 60 },
      { name: 'Mammography', duration: 25 },
      { name: 'Bone Scan', duration: 90 },
      { name: 'Nuclear Medicine', duration: 120 }
    ];

    // Clear existing scan types
    await ScanType.deleteMany({});
    console.log('Cleared existing scan types');

    // Insert default scan types
    for (const scanTypeData of defaultScanTypes) {
      const scanType = new ScanType({
        ...scanTypeData,
        createdBy: adminId
      });
      await scanType.save();
      console.log(`Created scan type: ${scanTypeData.name} (${scanTypeData.duration} min)`);
    }

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedScanTypes();
