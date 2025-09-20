const axios = require('axios');

async function testScanTypeAPI() {
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('Testing scan types API...');
    
    // First, get available scan types
    const scanTypesResponse = await axios.get(`${baseURL}/api/scans/types`);
    console.log('Available scan types:', scanTypesResponse.data.data);
    
    if (scanTypesResponse.data.data && scanTypesResponse.data.data.length > 0) {
      // Test the new available dates endpoint with the first scan type
      const testScanType = scanTypesResponse.data.data[0];
      console.log(`\nTesting available dates for scan type: ${testScanType}`);
      
      const availableDatesResponse = await axios.get(`${baseURL}/api/scans/available-dates/${testScanType}`);
      console.log('Available dates response:', JSON.stringify(availableDatesResponse.data, null, 2));
    } else {
      console.log('No scan types found in the system');
    }
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testScanTypeAPI();