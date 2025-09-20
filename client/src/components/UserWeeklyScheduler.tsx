import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isToday, isBeforeToday } from '../utils/istTime';

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

interface SlotInfo {
  scanId: string;
  scanType: string;
  date: string;
  startTime: string; // hh:mm
  endTime: string; // hh:mm
  duration: number;
  availableSlots: number;
  slotNumber: number;
  bookingDetails?: {
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
  } | null;
}

interface UserWeeklySchedulerProps {
  weeklyScans: WeeklyScans;
  currentWeek: Date;
  onSlotSelect: (slot: SlotInfo) => void;
  onBookedSlotClick?: (scan: Scan, slotNumber: number) => void;
  scanTypes?: string[];
  selectedScanType?: string;
}

const UserWeeklyScheduler: React.FC<UserWeeklySchedulerProps> = ({
  weeklyScans,
  currentWeek,
  onSlotSelect,
  scanTypes = [],
  selectedScanType = ''
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper function to get the date for each day
  const getDateForDay = (dayName: string, currentWeek: Date) => {
    const getWeekStart = (date: Date) => {
      const d = new Date(date);
      const utcDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const day = utcDate.getDay();
      const daysToSubtract = day === 0 ? 6 : day - 1;
      const weekStart = new Date(utcDate);
      weekStart.setDate(weekStart.getDate() - daysToSubtract);
      return weekStart;
    };

    const weekStart = getWeekStart(currentWeek);
    const dayIndex = days.indexOf(dayName);
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    return dayDate;
  };

  const getScanTypeColor = (scanType: string) => {
    const colors: { [key: string]: string } = {
      'CT': 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      'CT Scan': 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      'MRI': 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      'MRI Scan': 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      'X-Ray': 'bg-green-50 border-green-200 hover:bg-green-100',
      'Ultrasound': 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
      'PET Scan': 'bg-red-50 border-red-200 hover:bg-red-100',
      'Mammography': 'bg-pink-50 border-pink-200 hover:bg-pink-100',
      'Bone Scan': 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
      'Nuclear Medicine': 'bg-gray-50 border-gray-200 hover:bg-gray-100'
    };
    return colors[scanType] || 'bg-gray-50 border-gray-200 hover:bg-gray-100';
  };

  const getScanTypeTextColor = (scanType: string) => {
    const colors: { [key: string]: string } = {
      'CT': 'text-blue-800',
      'CT Scan': 'text-blue-800',
      'MRI': 'text-purple-800',
      'MRI Scan': 'text-purple-800',
      'X-Ray': 'text-green-800',
      'Ultrasound': 'text-yellow-800',
      'PET Scan': 'text-red-800',
      'Mammography': 'text-pink-800',
      'Bone Scan': 'text-indigo-800',
      'Nuclear Medicine': 'text-gray-800'
    };
    return colors[scanType] || 'text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Generate individual time slots for each scan. We create N slots where
  // N = scan.totalSlots (total number of slots). Each slot's start/end times 
  // are calculated by adding scan.duration minutes to the previous slot, 
  // beginning at scan.startTime. We show all slots but mark booked ones as unavailable.
  const generateTimeSlots = (scan: Scan) => {
    const slots: (SlotInfo & { isBooked: boolean })[] = [];
    const totalSlots = scan.totalSlots || 0;
    const bookedSlots = scan.bookingDetails || [];

    // Parse date components to construct local Date objects
    const scanDate = new Date(scan.date);
    const year = scanDate.getFullYear();
    const month = scanDate.getMonth();
    const day = scanDate.getDate();

    // Parse start time (assumed format 'HH:MM')
    const [startHourStr, startMinStr] = scan.startTime.split(':');
    const startHour = parseInt(startHourStr, 10) || 0;
    const startMin = parseInt(startMinStr, 10) || 0;

    // Create a set of booked slot numbers for quick lookup
    const bookedSlotNumbers = new Set(
      bookedSlots.map((booking: any) => booking.slotNumber)
    );

    // For each total slot, compute its start and end times
    for (let i = 0; i < totalSlots; i++) {
      const slotNumber = i + 1;
      const isBooked = bookedSlotNumbers.has(slotNumber);
      
      // Find booking details for this slot if it's booked
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {!weeklyScans ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading schedule...</div>
        </div>
      ) : (
        <div className={`grid gap-4 p-6 ${
          selectedScanType 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7'
        }`}>
          {days
            .filter(day => {
              // If no scan type is selected, show all days
              if (!selectedScanType) return true;
              
              // If a scan type is selected, only show days that have scans for that type
              const dayScans = weeklyScans[day] || [];
              return dayScans.length > 0; // The filtering by scan type is already done in UserBookingManager
            })
            .map(day => {
            const dayScans = weeklyScans[day] || [];
            const dayDate = getDateForDay(day, currentWeek);
            const isDayToday = isToday(dayDate);
            const isDayPast = isBeforeToday(dayDate);
            
            return (
              <div key={day} className={`border border-gray-200 rounded-lg overflow-hidden ${
                isDayToday ? 'ring-2 ring-blue-500 border-blue-300' : ''
              }`}>
                {/* Day Header */}
                <div className={`px-4 py-3 border-b border-gray-200 ${
                  isDayToday 
                    ? 'bg-blue-50 border-blue-200' 
                    : isDayPast 
                    ? 'bg-gray-100' 
                    : 'bg-gray-50'
                }`}>
                  <h3 className={`font-semibold text-center ${
                    isDayToday 
                      ? 'text-blue-800' 
                      : isDayPast 
                      ? 'text-gray-500' 
                      : 'text-gray-800'
                  }`}>
                    {day}
                    {isDayToday && <span className="text-xs block text-blue-600 font-normal">Today</span>}
                  </h3>
                  <p className={`text-sm text-center mt-1 ${
                    isDayToday 
                      ? 'text-blue-700' 
                      : isDayPast 
                      ? 'text-gray-400' 
                      : 'text-gray-600'
                  }`}>
                    {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                
                {/* Day Content */}
                <div className="p-4 min-h-[400px] space-y-3">
                  {dayScans.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p className="text-sm">No available appointments</p>
                    </div>
                  ) : (
                    <>
                      {dayScans.map(scan => {
                        const timeSlots = generateTimeSlots(scan);
                        
                        return (
                          <div key={scan._id} className="space-y-2">
                            {/* Scan Type Header */}
                            <div className={`p-2 rounded-md border ${getScanTypeColor(scan.scanType)}`}>
                              <div className={`font-medium text-sm ${getScanTypeTextColor(scan.scanType)}`}>
                                {scan.scanType}
                              </div>
                              <div className="text-xs text-gray-600">
                                {formatDate(scan.date)} • {scan.startTime} - {scan.endTime}
                              </div>
                              <div className="text-xs text-gray-600">
                                {scan.availableSlots} available / {scan.totalSlots} total slots
                              </div>
                            </div>
                            
                            {/* Individual Time Slots */}
                            <div className="space-y-1 ml-2">
                              {timeSlots.map((slotInfo, slotIndex) => {
                                const isPastDay = isBeforeToday(slotInfo.date);
                                const isSlotDisabled = slotInfo.isBooked || isPastDay;
                                
                                return (
                                  <button
                                    key={`${scan._id}-${slotIndex}`}
                                    onClick={() => {
                                      if (isPastDay && !isAdmin) {
                                        return; // Block past day bookings for users
                                      }
                                      if (slotInfo.isBooked && isAdmin) {
                                        onSlotSelect(slotInfo);
                                      } else if (!slotInfo.isBooked) {
                                        onSlotSelect(slotInfo);
                                      }
                                    }}
                                    disabled={isSlotDisabled && !isAdmin}
                                    className={`w-full text-left p-3 rounded-md border-2 transition-all duration-200 ${
                                      isPastDay 
                                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                                        : slotInfo.isBooked 
                                          ? isAdmin 
                                            ? 'bg-orange-50 border-orange-300 cursor-pointer hover:bg-orange-100' 
                                            : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                                          : `border-dashed ${getScanTypeColor(scan.scanType)} border-opacity-50 hover:border-opacity-100 hover:shadow-sm cursor-pointer`
                                    }`}
                                  >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className={`font-medium text-sm ${
                                        slotInfo.isBooked 
                                          ? 'text-gray-600' 
                                          : getScanTypeTextColor(scan.scanType)
                                      }`}>
                                        Slot #{slotInfo.slotNumber}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {slotInfo.startTime} - {slotInfo.endTime}
                                      </div>
                                    </div>
                                    <div className={`text-xs font-medium ${
                                      isPastDay 
                                        ? 'text-gray-400' 
                                        : slotInfo.isBooked 
                                          ? 'text-red-600' 
                                          : 'text-green-600'
                                    }`}>
                                      {isPastDay ? 'Past' : slotInfo.isBooked ? 'Booked' : 'Available'}
                                    </div>
                                  </div>
                                  
                                  {/* Hover tooltip */}
                                  {isPastDay ? (
                                    <div className="mt-2">
                                      <div className="text-xs text-gray-400">
                                        Past appointments cannot be booked
                                      </div>
                                    </div>
                                  ) : !slotInfo.isBooked ? (
                                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="text-xs text-gray-500">
                                        Click to book this appointment
                                      </div>
                                    </div>
                                  ) : isAdmin ? (
                                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="text-xs text-orange-600">
                                        Click to view booking details
                                      </div>
                                    </div>
                                  ) : null}
                                </button>
                              );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Legend */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="text-sm text-gray-600 mb-2 font-medium">Available Scan Types:</div>
        <div className="flex flex-wrap gap-2">
          {scanTypes.length === 0 ? (
            <div className="text-sm text-gray-500">No scan types available</div>
          ) : (
            scanTypes.map((st) => (
              <span key={st} className={`px-2 py-1 rounded-md border text-xs font-medium ${getScanTypeColor(st)} ${getScanTypeTextColor(st)}`}>
                {st}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserWeeklyScheduler;
