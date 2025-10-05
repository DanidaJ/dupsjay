import React, { useState } from 'react';
import downloadAppointmentDetails from '../utils/downloadAppointmentDetails';

interface BookedAppointmentDetails {
  // Slot details
  scanType: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  
  // Booking details
  patientName: string;
  patientPhone: string;
  notes?: string;
  bookerName?: string;
  bookedAt: string;
  
  // Additional details
  slotNumber?: number;
}

interface AppointmentDetailsModalProps {
  appointmentDetails: BookedAppointmentDetails;
  onClose: () => void;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointmentDetails,
  onClose
}) => {
  const [downloadFormat, setDownloadFormat] = useState<'txt' | 'html'>('txt');

  const handleDownload = () => {
    downloadAppointmentDetails(appointmentDetails, downloadFormat);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getScanTypeColor = (scanType: string) => {
    const colors: { [key: string]: string } = {
      'CT Scan': 'bg-blue-100 text-blue-800 border-blue-200',
      'MRI Scan': 'bg-purple-100 text-purple-800 border-purple-200',
      'X-Ray': 'bg-green-100 text-green-800 border-green-200',
      'Ultrasound': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'PET Scan': 'bg-red-100 text-red-800 border-red-200',
      'Mammography': 'bg-pink-100 text-pink-800 border-pink-200',
      'Bone Scan': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Nuclear Medicine': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[scanType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-900">Booking Confirmed</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-green-600 mt-1">Your appointment has been successfully booked!</p>
        </div>

        {/* Appointment Details */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Appointment Details</h3>
          <div className={`p-4 rounded-lg border-2 ${getScanTypeColor(appointmentDetails.scanType)}`}>
            <div className="font-semibold text-lg mb-2">{appointmentDetails.scanType}</div>
            <div className="space-y-1 text-sm">
              <div><strong>Date:</strong> {formatDate(appointmentDetails.date)}</div>
              <div><strong>Time:</strong> {appointmentDetails.startTime} - {appointmentDetails.endTime}</div>
              <div><strong>Duration:</strong> {appointmentDetails.duration} minutes</div>
              {appointmentDetails.slotNumber && (
                <div><strong>Slot:</strong> #{appointmentDetails.slotNumber}</div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Patient Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Patient Name:</span>
              <span className="text-sm text-gray-900">{appointmentDetails.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Phone Number:</span>
              <span className="text-sm text-gray-900">{appointmentDetails.patientPhone}</span>
            </div>
            {appointmentDetails.notes && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-600 block mb-1">Notes:</span>
                <span className="text-sm text-gray-900">{appointmentDetails.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Information */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Booking Information</h3>
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-blue-600">Booked By:</span>
              <span className="text-sm text-blue-900">{appointmentDetails.bookerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-blue-600">Booking Time:</span>
              <span className="text-sm text-blue-900">{formatDateTime(appointmentDetails.bookedAt)}</span>
            </div>
          </div>
        </div>

        {/* Download Format Selection */}
        <div className="px-6 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Download Format</h3>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setDownloadFormat('txt')}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                downloadFormat === 'txt' 
                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Text File
            </button>
            <button
              onClick={() => setDownloadFormat('html')}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                downloadFormat === 'html' 
                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              HTML File
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-2">
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center justify-center"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              Download Details
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            Please arrive 15 minutes before your appointment time. A confirmation email has been sent.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;