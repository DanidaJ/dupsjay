const ScanType = require('../models/ScanType');

// Get all scan types
exports.getScanTypes = async (req, res) => {
  try {
    const scanTypes = await ScanType.find().sort({ name: 1 });
    res.json({
      success: true,
      data: scanTypes
    });
  } catch (error) {
    console.error('Error fetching scan types:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scan types',
      error: error.message
    });
  }
};

// Create new scan type
exports.createScanType = async (req, res) => {
  try {
    const { name, duration } = req.body;

    // Validate input
    if (!name || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Name and duration are required'
      });
    }

    if (duration < 5 || duration > 300) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 5 and 300 minutes'
      });
    }

    // Check if scan type with same name already exists
    const existingScanType = await ScanType.findOne({ 
      name: { $regex: new RegExp('^' + name + '$', 'i') } 
    });

    if (existingScanType) {
      return res.status(400).json({
        success: false,
        message: 'A scan type with this name already exists'
      });
    }

    const scanType = new ScanType({
      name: name.trim(),
      duration: parseInt(duration),
      createdBy: req.user.id
    });

    await scanType.save();

    res.status(201).json({
      success: true,
      message: 'Scan type created successfully',
      data: scanType
    });
  } catch (error) {
    console.error('Error creating scan type:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating scan type',
      error: error.message
    });
  }
};

// Update scan type
exports.updateScanType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration } = req.body;

    // Validate input
    if (!name || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Name and duration are required'
      });
    }

    if (duration < 5 || duration > 300) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 5 and 300 minutes'
      });
    }

    // Check if scan type exists
    const scanType = await ScanType.findById(id);
    if (!scanType) {
      return res.status(404).json({
        success: false,
        message: 'Scan type not found'
      });
    }

    // Check if another scan type with same name exists (excluding current one)
    const existingScanType = await ScanType.findOne({ 
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      _id: { $ne: id }
    });

    if (existingScanType) {
      return res.status(400).json({
        success: false,
        message: 'A scan type with this name already exists'
      });
    }

    scanType.name = name.trim();
    scanType.duration = parseInt(duration);
    scanType.updatedAt = new Date();

    await scanType.save();

    res.json({
      success: true,
      message: 'Scan type updated successfully',
      data: scanType
    });
  } catch (error) {
    console.error('Error updating scan type:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating scan type',
      error: error.message
    });
  }
};

// Delete scan type
exports.deleteScanType = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if scan type exists
    const scanType = await ScanType.findById(id);
    if (!scanType) {
      return res.status(404).json({
        success: false,
        message: 'Scan type not found'
      });
    }

    // Check if this scan type is being used in any scans
    const Scan = require('../models/Scan');
    const scanCount = await Scan.countDocuments({ scanType: scanType.name });

    if (scanCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete scan type. It is currently used in ${scanCount} scan(s). Please remove or reassign those scans first.`
      });
    }

    await ScanType.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Scan type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scan type:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting scan type',
      error: error.message
    });
  }
};
