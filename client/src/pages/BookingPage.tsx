import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import keycloakService from '../services/keycloakService';
import { useToast } from '../contexts/ToastContext';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [scanTypes, setScanTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScanTypes();
  }, []);

  const fetchScanTypes = async () => {
    try {
      const token = keycloakService.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/scans/types`, { headers });
      const types = resp.data.data || [];
      setScanTypes(types);
    } catch (err: any) {
      console.error('Error fetching scan types:', err);
      addToast({ message: 'Error loading scan types', type: 'error' });
      setScanTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScanTypeClick = (scanType: string) => {
    navigate(`/book/${encodeURIComponent(scanType)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Book Your Appointment</h1>
          <p className="text-lg text-gray-600">Select a scan type to view available time slots</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : scanTypes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">No scan types available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scanTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleScanTypeClick(type)}
                className="w-full bg-white hover:bg-blue-50 text-gray-800 font-semibold py-5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 border-2 border-transparent hover:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{type}</span>
                  <svg 
                    className="w-6 h-6 text-blue-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
