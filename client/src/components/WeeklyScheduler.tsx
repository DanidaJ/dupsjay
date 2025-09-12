import React from 'react';
import { isToday, isBeforeToday, isTomorrowOrLater } from '../utils/istTime';

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

interface WeeklySchedulerProps {
  weeklyScans: WeeklyScans;
  currentWeek: Date;
  onTimeSlotClick: (day: string) => void;
  onScanDelete: (scanId: string) => void;
  onScanClick?: (scan: Scan) => void;
}

const WeeklyScheduler: React.FC<WeeklySchedulerProps> = ({
  weeklyScans,
  currentWeek,
  onTimeSlotClick,
  onScanDelete,
  onScanClick
}) => {
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
    <div className="p-6">
      {!weeklyScans ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading schedule...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {days.map(day => {
            const dayScans = weeklyScans[day] || [];
            const dayDate = getDateForDay(day, currentWeek);
            const isDayToday = isToday(dayDate);
            const isDayPast = isBeforeToday(dayDate);
            const canAdminSchedule = isTomorrowOrLater(dayDate);
            
            return (
              <div key={day} className={`bg-white border border-gray-200 rounded-lg shadow-sm ${
                isDayToday ? 'ring-2 ring-blue-500 border-blue-300' : ''
              }`}>
                {/* Day Header */}
                <div className={`px-4 py-3 border-b border-gray-200 rounded-t-lg ${
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
                <div className="p-4 min-h-[300px]">
                  {/* Add Button */}
                  {canAdminSchedule ? (
                    <button
                      onClick={() => onTimeSlotClick(day)}
                      className="w-full mb-4 px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">+</span>
                      <span className="font-medium">Add Scan Types</span>
                    </button>
                  ) : (
                    <div className="w-full mb-4 px-4 py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-lg flex items-center justify-center gap-2 opacity-60">
                      <span className="text-xl">+</span>
                      <span className="font-medium">
                        {isDayToday ? 'Cannot schedule for today' : 'Cannot schedule for past days'}
                      </span>
                    </div>
                  )}
                  
                  {/* Existing Scans */}
                  <div className="space-y-3">
                    {dayScans.map(scan => (
                      <div 
                        key={scan._id} 
                        className={`p-3 rounded-lg border-2 ${getScanTypeColor(scan.scanType)} relative group ${
                          scan.bookedSlots > 0 && onScanClick ? 'cursor-pointer hover:shadow-md' : ''
                        }`}
                        onClick={() => scan.bookedSlots > 0 && onScanClick && onScanClick(scan)}
                      >
                        {/* Delete button */}
                        {scan.bookedSlots === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onScanDelete(scan._id);
                            }}
                            className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-lg font-bold"
                            title="Delete scan type"
                          >
                            ×
                          </button>
                        )}
                        
                        {/* Scan Info */}
                        <div className="pr-6">
                          <div className="font-semibold text-sm mb-1">{scan.scanType}</div>
                          <div className="text-xs text-gray-600 mb-2">
                            {scan.startTime} - {scan.endTime}
                          </div>
                          <div className="text-xs text-purple-600 mb-2 font-mono">
                            Date: {new Date(scan.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs font-medium">
                            <span className="text-green-600">{scan.totalSlots - scan.bookedSlots} available</span>
                            <span className="text-gray-500"> / </span>
                            <span className="text-gray-700">{scan.totalSlots} total</span>
                          </div>
                          {scan.bookedSlots > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {scan.bookedSlots} booked
                              {onScanClick && (
                                <span className="text-gray-500 ml-1">(click to view)</span>
                              )}
                            </div>
                          )}
                          {scan.bookedSlots >= scan.totalSlots && (
                            <div className="text-xs text-red-600 font-bold mt-1">FULLY BOOKED</div>
                          )}
                        </div>
                        
                        {/* Hover Details */}
                        <div className="absolute z-10 invisible group-hover:visible bg-black text-white p-3 rounded shadow-lg text-xs bottom-full left-0 mb-2 w-64">
                          <div className="mb-2">
                            <strong>{scan.scanType}</strong>
                          </div>
                          <div><strong>Time:</strong> {scan.startTime} - {scan.endTime}</div>
                          <div><strong>Duration:</strong> {scan.duration} minutes</div>
                          <div><strong>Total Slots:</strong> {scan.totalSlots}</div>
                          <div><strong>Available:</strong> {scan.totalSlots - scan.bookedSlots}</div>
                          <div><strong>Booked:</strong> {scan.bookedSlots}</div>
                          
                          {scan.bookingDetails && scan.bookingDetails.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-600">
                              <strong>Bookings:</strong>
                              <div className="max-h-20 overflow-y-auto mt-1">
                                {scan.bookingDetails.map((booking, index) => (
                                  <div key={index} className="text-xs">
                                    • Slot {booking.slotNumber}: {booking.patientName} ({booking.slotStartTime})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {scan.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-600">
                              <strong>Notes:</strong> {scan.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Empty State */}
                  {dayScans.length === 0 && (
                    <div className="text-center text-gray-400 mt-8">
                      <div className="text-lg mb-2">📅</div>
                      <div className="text-sm">No scan types scheduled</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};export default WeeklyScheduler;
