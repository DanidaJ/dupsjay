import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserBookingManager from '../components/UserBookingManager';

const ScanTypeAppointmentsPage: React.FC = () => {
  const { scanType } = useParams<{ scanType: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/book')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4 transition-colors"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Back to Scan Types
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {scanType ? decodeURIComponent(scanType) : 'Appointments'}
          </h1>
          <p className="text-gray-600 mt-2">Select an available time slot to book your appointment</p>
        </div>
        <UserBookingManager preSelectedScanType={scanType ? decodeURIComponent(scanType) : undefined} />
      </div>
    </div>
  );
};

export default ScanTypeAppointmentsPage;
