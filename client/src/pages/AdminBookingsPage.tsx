import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import keycloakService from '../services/keycloakService';
import * as XLSX from 'xlsx';

interface Booking {
  _id: string;
  scanType: string;
  scanDate: string;
  slotStartTime: string;
  slotEndTime: string;
  patientName: string;
  bookerName: string;
  bookerUserId: string;
  patientPhone: string;
  notes?: string;
  bookingStatus: string;
  bookedAt: string;
}

const AdminBookingsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { addToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Check if user has admin role
  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchWeeklyBookings();
  }, [currentWeek]);

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const dayOfWeek = d.getDay();

    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(year, month, day - daysToSubtract, 12, 0, 0);
    return monday;
  };

  const getWeekEnd = (weekStart: Date) => {
    const sunday = new Date(weekStart);
    sunday.setDate(sunday.getDate() + 6);
    return sunday;
  };

  const formatDateRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'numeric', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const fetchWeeklyBookings = async () => {
    setLoading(true);
    try {
      const token = keycloakService.getToken();
      const weekStart = getWeekStart(currentWeek);
      
      console.log('Fetching bookings for week starting:', weekStart.toISOString().split('T')[0]);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/scans/bookings/week/${weekStart.toISOString().split('T')[0]}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('Weekly bookings response:', response.data);
      setBookings(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching weekly bookings:', error);
      addToast({ message: 'Error fetching bookings', type: 'error' });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const handleExportToExcel = () => {
    if (bookings.length === 0) {
      addToast({ message: 'No bookings to export', type: 'info' });
      return;
    }

    // Prepare data for Excel
    const excelData = bookings.map(booking => ({
      'Booking Date': formatDate(booking.scanDate),
      'Scan Type': booking.scanType,
      'Slot Start Time': booking.slotStartTime,
      'Slot End Time': booking.slotEndTime,
      'Patient Name': booking.patientName,
      'Booker Name': booking.bookerName || 'N/A',
      'Patient Phone': booking.patientPhone,
      'Notes': booking.notes || '',
      'Booking Status': booking.bookingStatus,
      'Booked At': new Date(booking.bookedAt).toLocaleString('en-US')
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Booking Date
      { wch: 20 }, // Scan Type
      { wch: 15 }, // Slot Start Time
      { wch: 15 }, // Slot End Time
      { wch: 20 }, // Patient Name
      { wch: 20 }, // Booker Name
      { wch: 15 }, // Patient Phone
      { wch: 30 }, // Notes
      { wch: 15 }, // Booking Status
      { wch: 20 }  // Booked At
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');

    // Generate filename with date range
    const weekStart = getWeekStart(currentWeek);
    const weekEnd = getWeekEnd(weekStart);
    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];
    const filename = `Bookings_${startStr}_to_${endStr}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
    
    addToast({ message: 'Bookings exported successfully', type: 'success' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Bookings</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage all appointment bookings
            </p>
          </div>
          <button
            onClick={handleExportToExcel}
            disabled={loading || bookings.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePreviousWeek}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Previous Week
            </button>
            
            <div className="text-lg font-semibold text-gray-900">
              {formatDateRange(getWeekStart(currentWeek), getWeekEnd(getWeekStart(currentWeek)))}
            </div>
            
            <button
              onClick={handleNextWeek}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Next Week →
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No bookings found for this week</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scan Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slot Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slot End Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booker Name
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(booking.scanDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.scanType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(booking.slotStartTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(booking.slotEndTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.patientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.bookerName || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && bookings.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''} for the week
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingsPage;
