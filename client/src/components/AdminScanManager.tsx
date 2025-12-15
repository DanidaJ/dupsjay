import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import keycloakService from '../services/keycloakService';
import WeeklyScheduler from './WeeklyScheduler';
import ScanModal from './ScanModal';
import ScanTypeManager from './ScanTypeManager';
import AdminBookingDetails from './AdminBookingDetails';

interface Scan {
  _id: string;
  scanType: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  bookings: Array<{
    _id: string;
    userId: string;
    patientName: string;
    patientId: string;
    bookedAt: string;
    notes?: string;
  }>;
  bookingDetails?: Array<{
    _id: string;
    slotNumber: number;
    slotStartTime: string;
    slotEndTime: string;
    patientName: string;
    patientId: string;
    bookedAt: string;
    notes?: string;
    isAnonymous: boolean;
    userId?: string;
  }>;
  notes?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
}

interface WeeklyScans {
  [key: string]: Scan[];
}

const AdminScanManager: React.FC = () => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const [weeklyScans, setWeeklyScans] = useState<WeeklyScans>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  });
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showScanTypeManager, setShowScanTypeManager] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedScanForBookings, setSelectedScanForBookings] = useState<Scan | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    day: string;
    time: string;
    date: string;
  } | null>(null);
  const [scanTypes, setScanTypes] = useState<string[]>([]);
  const [scanTypeDetails, setScanTypeDetails] = useState<Array<{_id: string; name: string; duration: number}>>([]);

  useEffect(() => {
    fetchScanTypes();
    fetchScanTypeDetails();
    fetchWeeklyScans();
  }, [currentWeek]);

  const fetchScanTypes = async () => {
    try {
      const token = keycloakService.getToken();
      console.log('Fetching scan types with token:', token ? 'Token present' : 'No token');
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/scans/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Scan types response:', response.data);
      setScanTypes(response.data.data);
    } catch (error: any) {
      console.error('Error fetching scan types:', error);
      console.error('Error response:', error.response?.data);
      addToast({ message: 'Error fetching scan types', type: 'error' });
    }
  };

  const fetchScanTypeDetails = async () => {
    try {
      const token = keycloakService.getToken();
      console.log('=== CLIENT DEBUG INFO ===');
      console.log('Current user:', currentUser);
      console.log('Token present:', !!token);
      console.log('Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'None');
      console.log('Is Keycloak authenticated:', keycloakService.isAuthenticated());
      console.log('=== END CLIENT DEBUG INFO ===');
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/scans/scan-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Detailed scan types response:', response.data);
      setScanTypeDetails(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching detailed scan types:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message
      });
      // Don't show toast error for this since scanTypes is the main one
    }
  };

  const fetchWeeklyScans = async () => {
    setLoading(true);
    try {
      const token = keycloakService.getToken();
      const weekStart = getWeekStart(currentWeek);
      
      // Debug logging
      console.log('=== CLIENT WEEK CALCULATION DEBUG ===');
      console.log('Current week state:', currentWeek.toISOString());
      console.log('Calculated week start:', weekStart.toISOString());
      console.log('Week start date string:', weekStart.toISOString().split('T')[0]);
      console.log('=====================================');
      
      console.log('Fetching weekly scans for week starting:', weekStart.toISOString().split('T')[0]);
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/scans/week/${weekStart.toISOString().split('T')[0]}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Weekly scans response:', response.data);
      
      // Ensure we have a proper structure even if the response is empty
      const scansData = response.data.data || {};
      const initializedScans = {
        Monday: scansData.Monday || [],
        Tuesday: scansData.Tuesday || [],
        Wednesday: scansData.Wednesday || [],
        Thursday: scansData.Thursday || [],
        Friday: scansData.Friday || [],
        Saturday: scansData.Saturday || [],
        Sunday: scansData.Sunday || []
      };
      
      setWeeklyScans(initializedScans);
    } catch (error: any) {
      console.error('Error fetching weekly scans:', error);
      console.error('Error response:', error.response?.data);
      addToast({ message: 'Error fetching weekly scans', type: 'error' });
      
      // Set empty structure on error
      setWeeklyScans({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = (date: Date) => {
    // Calculate week start (Monday) for a given date and set time to local noon
    // This matches the approach in UserBookingManager and avoids ISO timezone
    // shifts that can move the date when converting to UTC string.
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const dayOfWeek = d.getDay();

    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is first day
    // Create Monday at 12:00 local time to avoid timezone/UTC conversion issues
    const monday = new Date(year, month, day - daysToSubtract, 12, 0, 0);
    return monday;
  };

  const handleTimeSlotClick = (day: string) => {
    const weekStart = getWeekStart(currentWeek);
    const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day);
    const slotDate = new Date(weekStart);
    slotDate.setDate(slotDate.getDate() + dayIndex);
    
    setSelectedTimeSlot({
      day,
      time: '09:00', // Default start time
      date: slotDate.toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleScanCreate = async (scanData: any) => {
    try {
      const token = keycloakService.getToken();
      console.log('Creating scan with data:', scanData);
      
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/scans`, scanData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast({ message: 'Scan scheduled successfully', type: 'success' });
      await fetchWeeklyScans();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error creating scan:', error);
      console.error('Error response:', error.response?.data);
      addToast({ message: error.response?.data?.message || 'Error creating scan', type: 'error' });
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleScanDelete = async (scanId: string) => {
    if (window.confirm('Are you sure you want to delete this scan?')) {
      try {
        const token = keycloakService.getToken();
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/scans/${scanId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        addToast({ message: 'Scan deleted successfully', type: 'success' });
        fetchWeeklyScans();
      } catch (error: any) {
        console.error('Error deleting scan:', error);
        console.error('Error response:', error.response?.data);
        addToast({ message: error.response?.data?.message || 'Error deleting scan', type: 'error' });
      }
    }
  };

  const handleScanClick = (scan: Scan) => {
    setSelectedScanForBookings(scan);
    setShowBookingDetails(true);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getWeekRange = () => {
    const weekStart = getWeekStart(currentWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return {
      start: weekStart.toLocaleDateString(),
      end: weekEnd.toLocaleDateString()
    };
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Scan Schedule Management</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowScanTypeManager(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Manage Scan Types
              </button>
              <button
                onClick={() => navigateWeek('prev')}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                ← Previous Week
              </button>
              <span className="text-lg font-medium">
                {getWeekRange().start} - {getWeekRange().end}
              </span>
              <button
                onClick={() => navigateWeek('next')}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Next Week →
              </button>
            </div>
          </div>
          {/* Debug info */}
          <div className="mt-4 p-2 bg-gray-100 rounded text-sm text-gray-600">
            <p>Available scan types: {scanTypes.length > 0 ? scanTypes.join(', ') : 'Loading...'}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <WeeklyScheduler
            weeklyScans={weeklyScans}
            currentWeek={currentWeek}
            onTimeSlotClick={handleTimeSlotClick}
            onScanDelete={handleScanDelete}
            onScanClick={handleScanClick}
          />
        )}
      </div>

      {showModal && selectedTimeSlot && (
        <ScanModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleScanCreate}
          scanTypes={scanTypes}
          scanTypeDetails={scanTypeDetails}
          selectedSlot={selectedTimeSlot}
        />
      )}

      {showScanTypeManager && (
        <ScanTypeManager
          isOpen={showScanTypeManager}
          onClose={() => setShowScanTypeManager(false)}
          onScanTypesUpdated={() => {
            fetchScanTypes();
            fetchScanTypeDetails();
          }}
        />
      )}

      {showBookingDetails && selectedScanForBookings && (
        <AdminBookingDetails
          scanId={selectedScanForBookings._id}
          scanType={selectedScanForBookings.scanType}
          scanDate={selectedScanForBookings.date}
          isOpen={showBookingDetails}
          onClose={() => {
            setShowBookingDetails(false);
            setSelectedScanForBookings(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminScanManager;
