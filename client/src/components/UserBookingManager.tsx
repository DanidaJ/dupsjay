import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { getToken } from '../services/authService';
import UserWeeklyScheduler from './UserWeeklyScheduler';
import BookingModal from './BookingModal';
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
    patientPhone: string;
    bookedAt: string;
    notes?: string;
  }>;
  bookingDetails?: Array<{
    _id: string;
    slotNumber: number;
    slotStartTime: string;
    slotEndTime: string;
    patientName: string;
    patientPhone: string;
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

interface SelectedSlot {
  scanId: string;
  scanType: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  availableSlots: number;
  slotNumber?: number;
}

const UserBookingManager: React.FC = () => {
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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedScanForBookings, setSelectedScanForBookings] = useState<Scan | null>(null);
  const [scanTypes, setScanTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailableScans();
    fetchScanTypes();
  }, [currentWeek]);

  const fetchScanTypes = async () => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await axios.get('http://localhost:5000/api/scans/types', { headers });
      setScanTypes(resp.data.data || []);
    } catch (err: any) {
      console.error('Error fetching scan types:', err);
    }
  };

  const getWeekStart = (date: Date) => {
    // Work with date components to avoid timezone issues
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    
    // Calculate days to subtract to get to Monday
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Create Monday with noon time to avoid timezone issues
    const monday = new Date(year, month, day - daysToSubtract, 12, 0, 0);
    return monday;
  };

  const fetchAvailableScans = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const weekStart = getWeekStart(currentWeek);
      
      console.log('Fetching scans for week starting:', weekStart.toISOString().split('T')[0]);
      console.log('Token exists:', !!token);
      console.log('Current user:', currentUser);

      // Send Authorization header only when token is present. Allow public access otherwise.
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`http://localhost:5000/api/scans/week/${weekStart.toISOString().split('T')[0]}`, {
        headers
      });
      
      console.log('API Response:', response.data);
      const scansData = response.data.data || {};
      console.log('Raw scans data from API:', scansData);
      
      // Log each day's scans before filtering
      Object.entries(scansData).forEach(([day, scans]) => {
        console.log(`${day} raw scans:`, scans);
        if (Array.isArray(scans)) {
          scans.forEach((scan: any) => {
            console.log(`${day} scan:`, {
              id: scan._id,
              scanType: scan.scanType,
              date: scan.date,
              totalSlots: scan.totalSlots,
              bookedSlots: scan.bookedSlots,
              availableSlots: scan.availableSlots,
              hasAvailableSlots: scan.availableSlots > 0
            });
          });
        }
      });
      
      // Filter only scans with available slots and future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('Today for filtering:', today.toISOString().split('T')[0]);
      
      const filteredScans = {
        Monday: (scansData.Monday || []).filter((scan: Scan) => {
          const scanDate = new Date(scan.date);
          const isToday = scanDate >= today;
          const hasSlots = scan.availableSlots > 0;
          console.log(`Monday scan filter - Date: ${scan.date}, isToday: ${isToday}, hasSlots: ${hasSlots}, availableSlots: ${scan.availableSlots}`);
          return isToday && hasSlots;
        }),
        Tuesday: (scansData.Tuesday || []).filter((scan: Scan) => {
          const scanDate = new Date(scan.date);
          const isToday = scanDate >= today;
          const hasSlots = scan.availableSlots > 0;
          console.log(`Tuesday scan filter - Date: ${scan.date}, isToday: ${isToday}, hasSlots: ${hasSlots}, availableSlots: ${scan.availableSlots}`);
          return isToday && hasSlots;
        }),
        Wednesday: (scansData.Wednesday || []).filter((scan: Scan) => {
          const scanDate = new Date(scan.date);
          const isToday = scanDate >= today;
          const hasSlots = scan.availableSlots > 0;
          console.log(`Wednesday scan filter - Date: ${scan.date}, isToday: ${isToday}, hasSlots: ${hasSlots}, availableSlots: ${scan.availableSlots}`);
          return isToday && hasSlots;
        }),
        Thursday: (scansData.Thursday || []).filter((scan: Scan) => {
          const scanDate = new Date(scan.date);
          const isToday = scanDate >= today;
          const hasSlots = scan.availableSlots > 0;
          console.log(`Thursday scan filter - Date: ${scan.date}, isToday: ${isToday}, hasSlots: ${hasSlots}, availableSlots: ${scan.availableSlots}`);
          return isToday && hasSlots;
        }),
        Friday: (scansData.Friday || []).filter((scan: Scan) => {
          const scanDate = new Date(scan.date);
          const isToday = scanDate >= today;
          const hasSlots = scan.availableSlots > 0;
          console.log(`Friday scan filter - Date: ${scan.date}, isToday: ${isToday}, hasSlots: ${hasSlots}, availableSlots: ${scan.availableSlots}`);
          return isToday && hasSlots;
        }),
        Saturday: (scansData.Saturday || []).filter((scan: Scan) => {
          const scanDate = new Date(scan.date);
          const isToday = scanDate >= today;
          const hasSlots = scan.availableSlots > 0;
          console.log(`Saturday scan filter - Date: ${scan.date}, isToday: ${isToday}, hasSlots: ${hasSlots}, availableSlots: ${scan.availableSlots}`);
          return isToday && hasSlots;
        }),
        Sunday: (scansData.Sunday || []).filter((scan: Scan) => {
          const scanDate = new Date(scan.date);
          const isToday = scanDate >= today;
          const hasSlots = scan.availableSlots > 0;
          console.log(`Sunday scan filter - Date: ${scan.date}, isToday: ${isToday}, hasSlots: ${hasSlots}, availableSlots: ${scan.availableSlots}`);
          return isToday && hasSlots;
        })
      };
      
      console.log('Filtered scans result:', filteredScans);
      console.log('Total available slots across all days:', 
        Object.values(filteredScans).reduce((total, dayScans) => total + dayScans.length, 0)
      );
      
      setWeeklyScans(filteredScans);
    } catch (error: any) {
    console.error('Error fetching available scans:', error);
    // Extra diagnostics
    console.error('Error message:', error?.message);
    console.error('Error response status:', error?.response?.status);
    console.error('Error response data:', error?.response?.data);
    addToast({ message: 'Error fetching available appointments', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Accepts a per-slot info object created in UserWeeklyScheduler
  const handleSlotSelect = (slot: any) => {
    // If admin user and slot is booked, show booking details
    if (currentUser?.role === 'admin' && slot.isBooked && slot.bookingDetails) {
      // Find the scan that contains this slot
      const allScans = Object.values(weeklyScans).flat();
      const scan = allScans.find(s => s._id === slot.scanId);
      if (scan) {
        setSelectedScanForBookings(scan);
        setShowBookingDetails(true);
      }
      return;
    }

    // For non-admin users or available slots, show booking modal
    if (!slot.isBooked) {
      setSelectedSlot({
        scanId: slot.scanId,
        scanType: slot.scanType,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        availableSlots: slot.availableSlots,
        slotNumber: slot.slotNumber
      });
      setShowBookingModal(true);
    }
  };

  const handleBookingSubmit = async (bookingData: {
    patientName: string;
    patientPhone: string;
    notes?: string;
  }) => {
    if (!selectedSlot) return;

    try {
      const token = getToken();

      // Build headers only if token exists so anonymous users can book too
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // TODO: Replace with actual booking endpoint when it's implemented
      await axios.post(`http://localhost:5000/api/scans/${selectedSlot.scanId}/book`, {
        patientName: bookingData.patientName,
        patientPhone: bookingData.patientPhone,
        notes: bookingData.notes,
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        slotNumber: selectedSlot.slotNumber
      }, {
        headers
      });

      addToast({ 
        message: 'Appointment booked successfully!', 
        type: 'success' 
      });
      
      setShowBookingModal(false);
      setSelectedSlot(null);
      
      // Refresh the scans to show updated availability
      fetchAvailableScans();
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      addToast({ 
        message: error.response?.data?.message || 'Error booking appointment', 
        type: 'error' 
      });
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getWeekDateRange = () => {
    const weekStart = getWeekStart(currentWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    };
    
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
        <button
          onClick={() => navigateWeek('prev')}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="mr-2">←</span>
          Previous Week
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {getWeekDateRange()}
          </h2>
          <p className="text-sm text-gray-500">Available Appointments</p>
        </div>
        
        <button
          onClick={() => navigateWeek('next')}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Next Week
          <span className="ml-2">→</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading available appointments...</span>
        </div>
      ) : (
        <UserWeeklyScheduler
          weeklyScans={weeklyScans}
          currentWeek={currentWeek}
          onSlotSelect={handleSlotSelect}
          scanTypes={scanTypes}
        />
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <BookingModal
          selectedSlot={selectedSlot}
          onSubmit={handleBookingSubmit}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSlot(null);
          }}
        />
      )}

      {/* Admin Booking Details Modal */}
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

export default UserBookingManager;
