import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { getToken } from '../services/authService';

interface BookingDetail {
  _id: string;
  slotNumber: number;
  slotStartTime: string;
  slotEndTime: string;
  patientName: string;
  patientPhone: string;
  bookedAt: string;
  notes?: string;
  isAnonymous: boolean;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface AdminBookingDetailsProps {
  scanId: string;
  scanType: string;
  scanDate: string;
  isOpen: boolean;
  onClose: () => void;
}

const AdminBookingDetails: React.FC<AdminBookingDetailsProps> = ({
  scanId,
  scanType,
  scanDate,
  isOpen,
  onClose
}) => {
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && scanId) {
      fetchBookings();
    }
  }, [isOpen, scanId]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/scans/${scanId}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBookings(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      addToast({ 
        message: 'Error fetching booking details', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                {scanType} - {formatDate(scanDate)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading bookings...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No bookings found for this scan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {bookings.length} Booking{bookings.length !== 1 ? 's' : ''}
                </h3>
              </div>
              
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Slot #{booking.slotNumber}
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Time:</strong> {booking.slotStartTime} - {booking.slotEndTime}</div>
                          <div><strong>Patient:</strong> {booking.patientName}</div>
                          <div><strong>Phone:</strong> {booking.patientPhone}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Booking Info</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Booked:</strong> {formatDateTime(booking.bookedAt)}</div>
                          <div>
                            <strong>Type:</strong>{' '}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              booking.isAnonymous 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {booking.isAnonymous ? 'Anonymous' : 'Registered User'}
                            </span>
                          </div>
                          {!booking.isAnonymous && booking.userId && (
                            <div>
                              <strong>User:</strong> {booking.userId.name}
                              <br />
                              <span className="text-xs text-gray-500">{booking.userId.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {booking.notes && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Notes</h5>
                          <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                            {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingDetails;
