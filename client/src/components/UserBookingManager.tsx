import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import keycloakService from '../services/keycloakService';
import UserWeeklyScheduler from './UserWeeklyScheduler';
import BookingModal from './BookingModal';
import AdminBookingDetails from './AdminBookingDetails';
import ChronologicalScanView from './ChronologicalScanView';
import AppointmentDetailsModal from './AppointmentDetailsModal';

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

const UserBookingManager: React.FC = () => {
  const { addToast } = useToast();
  const { currentUser, hasRole } = useAuth();
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
  // selectedScanType is nullable so no scan type is selected by default; user must click to filter
  const [selectedScanType, setSelectedScanType] = useState<string | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [bookedAppointmentDetails, setBookedAppointmentDetails] = useState<BookedAppointmentDetails | null>(null);

  useEffect(() => {
    fetchAvailableScans();
    fetchScanTypes();
  }, [currentWeek, selectedScanType]);

  const fetchScanTypes = async () => {
    try {
      const token = keycloakService.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/scans/types`, { headers });
      const types = resp.data.data || [];
      setScanTypes(types);
      
      // Do NOT auto-select a scan type — require the user to choose explicitly.
    } catch (err: any) {
      console.error('Error fetching scan types:', err);
      // Set empty array as fallback so the dropdown still shows with "Show All Scan Types" option
      setScanTypes([]);
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
      const token = keycloakService.getToken();
      const weekStart = getWeekStart(currentWeek);
      
      console.log('Fetching scans for week starting:', weekStart.toISOString().split('T')[0]);
      console.log('Token exists:', !!token);
      console.log('Current user:', currentUser);

      // Send Authorization header only when token is present. Allow public access otherwise.
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/scans/week/${weekStart.toISOString().split('T')[0]}`, {
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
      console.log('Selected scan type for filtering:', selectedScanType);
      
      const filterScans = (scans: Scan[]) => {
        return scans.filter((scan: Scan) => {
          const scanDate = new Date(scan.date);
          const isToday = scanDate >= today;
          const hasSlots = scan.availableSlots > 0;
          const matchesScanType = !selectedScanType || scan.scanType === selectedScanType;
          console.log(`Scan filter - Type: ${scan.scanType}, Date: ${scan.date}, isToday: ${isToday}, hasSlots: ${hasSlots}, matchesType: ${matchesScanType}`);
          return isToday && hasSlots && matchesScanType;
        });
      };
      
      const filteredScans = {
        Monday: filterScans(scansData.Monday || []),
        Tuesday: filterScans(scansData.Tuesday || []),
        Wednesday: filterScans(scansData.Wednesday || []),
        Thursday: filterScans(scansData.Thursday || []),
        Friday: filterScans(scansData.Friday || []),
        Saturday: filterScans(scansData.Saturday || []),
        Sunday: filterScans(scansData.Sunday || [])
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

  // Accepts a per-slot info object created in UserWeeklyScheduler or ScanTypeCalendar
  const handleSlotSelect = (slot: any) => {
    // If admin user and slot is booked, show booking details
    if (hasRole('admin') && slot.isBooked && slot.bookingDetails) {
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
    bookerName?: string;
    bookerUserId?: string;
  }) => {
    if (!selectedSlot) return;

    try {
      const token = keycloakService.getToken();

      // Build headers only if token exists so anonymous users can book too
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // TODO: Replace with actual booking endpoint when it's implemented
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/scans/${selectedSlot.scanId}/book`, {
        patientName: bookingData.patientName,
        patientPhone: bookingData.patientPhone,
        notes: bookingData.notes,
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        slotNumber: selectedSlot.slotNumber,
        bookerName: bookingData.bookerName,
        bookerUserId: bookingData.bookerUserId
      }, {
        headers
      });

      // Create appointment details object
      const appointmentDetails: BookedAppointmentDetails = {
        scanType: selectedSlot.scanType,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        duration: selectedSlot.duration,
        patientName: bookingData.patientName,
        patientPhone: bookingData.patientPhone,
        notes: bookingData.notes,
        bookerName: bookingData.bookerName,
        bookedAt: new Date().toISOString(),
        slotNumber: selectedSlot.slotNumber
      };

      addToast({ 
        message: 'Appointment booked successfully!', 
        type: 'success' 
      });
      
      setShowBookingModal(false);
      setSelectedSlot(null);
      
      // Show appointment details modal
      setBookedAppointmentDetails(appointmentDetails);
      setShowAppointmentDetails(true);
      
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
      {/* Scan Type Selection */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">

        {/* Buttons for each scan type. Generated from scanTypes so adding a new scan type will automatically render a new button. */}
        {/* On mobile: stack buttons vertically and make text slightly larger. On sm+ screens keep the original inline layout. */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          {hasRole('admin') && (
            <button
              type="button"
              onClick={() => setSelectedScanType(null)}
              className={`w-full sm:w-auto px-3 py-2 rounded-md border ${selectedScanType === null ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} hover:shadow-sm transition-colors text-base sm:text-sm`}
            >
              Show All Scan Types
            </button>
          )}

          {scanTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedScanType(type)}
              className={`w-full sm:w-auto px-3 py-2 rounded-md border ${selectedScanType === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} hover:shadow-sm transition-colors text-base sm:text-sm`}
            >
              {type}
            </button>
          ))}
        </div>

        {selectedScanType && (
          <p className="mt-2 text-sm text-blue-600">
            Showing only dates with available {selectedScanType} scan slots
          </p>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading available appointments...</span>
        </div>
      ) : selectedScanType ? (
        // Show chronological view for specific scan type
        <ChronologicalScanView
          selectedScanType={selectedScanType ?? ''}
          onSlotSelect={handleSlotSelect}
        />
      ) : hasRole('admin') ? (
        // Show weekly calendar view for admin users when no scan type is selected
        <>
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

          <UserWeeklyScheduler
            weeklyScans={weeklyScans}
            currentWeek={currentWeek}
            onSlotSelect={handleSlotSelect}
            scanTypes={scanTypes}
            selectedScanType={selectedScanType ?? ''}
          />
        </>
      ) : (
        // For non-admin users, show message to select a scan type
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Please Select a Scan Type
            </h3>
            <p className="text-gray-600 mb-4">
              Choose a specific scan type from the dropdown above to view available appointment slots.
            </p>
            <div className="text-sm text-gray-500">
              Available scan types: {scanTypes.join(', ')}
            </div>
          </div>
        </div>
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

      {/* Appointment Details Modal */}
      {showAppointmentDetails && bookedAppointmentDetails && (
        <AppointmentDetailsModal
          appointmentDetails={bookedAppointmentDetails}
          onClose={() => {
            setShowAppointmentDetails(false);
            setBookedAppointmentDetails(null);
          }}
        />
      )}
    </div>
  );
};

export default UserBookingManager;
