import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';
import { useToast } from '../contexts/ToastContext';

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
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
}

interface SlotInfo {
  scanId: string;
  scanType: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  availableSlots: number;
  slotNumber: number;
  isBooked: boolean;
  bookingDetails?: any;
}

interface ChronologicalScanViewProps {
  selectedScanType: string;
  onSlotSelect: (slot: SlotInfo) => void;
}

const ChronologicalScanView: React.FC<ChronologicalScanViewProps> = ({
  selectedScanType,
  onSlotSelect
}) => {
  const { addToast } = useToast();
  const [scansData, setScansData] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedScanType) {
      fetchAllScans();
    }
  }, [selectedScanType]);

  const fetchAllScans = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch data for multiple weeks to get a good range
      const allScans: Scan[] = [];
      const today = new Date();
      
      // Fetch next 12 weeks of data
      for (let weekOffset = 0; weekOffset < 12; weekOffset++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + (weekOffset * 7));
        const monday = getWeekStart(weekStart);
        
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/scans/week/${monday.toISOString().split('T')[0]}`,
            { headers }
          );
          
          const weekData = response.data.data || {};
          // Flatten all days and filter by scan type
          const weekScans = Object.values(weekData).flat() as Scan[];
          const filteredScans = weekScans.filter(scan => 
            scan.scanType === selectedScanType && 
            scan.availableSlots > 0 &&
            new Date(scan.date) >= today
          );
          
          allScans.push(...filteredScans);
        } catch (err) {
          // Continue with other weeks if one fails
          console.warn(`Failed to fetch week ${weekOffset}:`, err);
        }
      }
      
      // Sort by date
      allScans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log('Fetched scans for chronological view:', allScans);
      setScansData(allScans);
    } catch (error: any) {
      console.error('Error fetching scans:', error);
      addToast({ 
        message: 'Error fetching available appointments', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(year, month, day - daysToSubtract, 12, 0, 0);
    return monday;
  };

  // Generate individual time slots for each scan (same logic as UserWeeklyScheduler)
  const generateTimeSlots = (scan: Scan): SlotInfo[] => {
    const slots: SlotInfo[] = [];
    const totalSlots = scan.totalSlots || 0;
    const bookedSlots = scan.bookingDetails || [];

    const scanDate = new Date(scan.date);
    const year = scanDate.getFullYear();
    const month = scanDate.getMonth();
    const day = scanDate.getDate();

    const [startHourStr, startMinStr] = scan.startTime.split(':');
    const startHour = parseInt(startHourStr, 10) || 0;
    const startMin = parseInt(startMinStr, 10) || 0;

    const bookedSlotNumbers = new Set(
      bookedSlots.map((booking: any) => booking.slotNumber)
    );

    for (let i = 0; i < totalSlots; i++) {
      const slotNumber = i + 1;
      const isBooked = bookedSlotNumbers.has(slotNumber);
      
      // Skip booked slots for chronological view
      if (isBooked) continue;

      const bookingDetail = bookedSlots.find((booking: any) => booking.slotNumber === slotNumber);

      const slotStart = new Date(year, month, day, startHour, startMin + i * scan.duration, 0);
      const slotEnd = new Date(slotStart.getTime() + scan.duration * 60 * 1000);

      const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

      slots.push({
        scanId: scan._id,
        scanType: scan.scanType,
        date: scan.date,
        startTime: fmt(slotStart),
        endTime: fmt(slotEnd),
        duration: scan.duration,
        availableSlots: scan.availableSlots,
        slotNumber: slotNumber,
        isBooked: isBooked,
        bookingDetails: bookingDetail || null
      });
    }

    return slots;
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    if (date.toDateString() === today.toDateString()) {
      return `${formattedDate} (Today)`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `${formattedDate} (Tomorrow)`;
    }
    
    return formattedDate;
  };

  const handleSlotClick = (slot: SlotInfo) => {
    onSlotSelect(slot);
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading available appointments...</span>
        </div>
      </div>
    );
  }

  if (scansData.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">No Available Appointments</p>
          <p>There are currently no available {selectedScanType} scan appointments in the next 3 months.</p>
        </div>
      </div>
    );
  }

  // Group scans by date
  const scansByDate: { [key: string]: Scan[] } = {};
  scansData.forEach(scan => {
    if (!scansByDate[scan.date]) {
      scansByDate[scan.date] = [];
    }
    scansByDate[scan.date].push(scan);
  });

  const sortedDates = Object.keys(scansByDate).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Available {selectedScanType} Scan Appointments
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {sortedDates.length} date{sortedDates.length !== 1 ? 's' : ''} with available slots
        </p>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          {sortedDates.map((dateStr) => {
            const dayScans = scansByDate[dateStr];
            // Generate all available slots for this date
            const allSlots: SlotInfo[] = [];
            dayScans.forEach(scan => {
              const scanSlots = generateTimeSlots(scan);
              allSlots.push(...scanSlots);
            });
            
            // Sort slots by time
            allSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={dateStr}
                className="border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 text-lg">
                        {formatDateDisplay(dateStr)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {allSlots.length} slot{allSlots.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Available
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Available Time Slots:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {allSlots.map((slot) => (
                        <button
                          key={`${slot.scanId}-${slot.slotNumber}`}
                          onClick={() => handleSlotClick(slot)}
                          className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition-colors duration-200 text-left border border-blue-200 hover:border-blue-300"
                        >
                          <div className="font-medium">{slot.startTime} - {slot.endTime}</div>
                          <div className="text-xs opacity-80">
                            Available
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChronologicalScanView;