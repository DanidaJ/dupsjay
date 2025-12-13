import React from 'react';

interface Scan {
  _id: string;
  scanType: string;
  startTime: string;
  endTime: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
}

interface DailyTimelineViewProps {
  scans: Scan[];
  selectedDate: string;
}

const DailyTimelineView: React.FC<DailyTimelineViewProps> = ({ scans, selectedDate }) => {
  // Generate time slots from 6:00 AM to 11:30 PM in 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const calculateScanPosition = (scan: Scan) => {
    const startMinutes = timeToMinutes(scan.startTime);
    const endMinutes = timeToMinutes(scan.endTime);
    const firstSlotMinutes = timeToMinutes(timeSlots[0]); // 6:00 AM = 360 minutes
    
    // Calculate position from top (each 30 min slot is either h-8 or h-6)
    // We'll use a consistent height per slot for positioning
    const slotHeight = 28; // Average height in pixels (h-7)
    const slotsFromStart = (startMinutes - firstSlotMinutes) / 30;
    const durationInSlots = (endMinutes - startMinutes) / 30;
    
    return {
      top: slotsFromStart * slotHeight,
      height: durationInSlots * slotHeight
    };
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg border border-gray-200">
      <div className="bg-white border-b border-gray-300 p-2">
        <h3 className="font-semibold text-gray-800 text-center text-sm">
          Daily Schedule
        </h3>
        <p className="text-xs text-gray-600 text-center mt-0.5">
          {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="relative">
          {/* Time grid */}
          {timeSlots.map((time) => {
            const isHourMark = time.endsWith(':00');
            
            return (
              <div
                key={time}
                className={`flex items-center border-l-2 border-gray-300 pl-2 ${
                  isHourMark ? 'h-7' : 'h-7'
                }`}
              >
                {/* Time label */}
                <div className={`w-16 text-xs ${isHourMark ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>
                  {isHourMark ? time : ''}
                </div>
                
                {/* Timeline area with border */}
                <div className={`flex-1 h-full ${isHourMark ? 'border-t border-gray-200' : ''}`}></div>
              </div>
            );
          })}
          
          {/* Scan blocks positioned absolutely */}
          <div className="absolute top-0 left-20 right-0 pointer-events-none">
            {scans.map((scan) => {
              const position = calculateScanPosition(scan);
              
              return (
                <div
                  key={scan._id}
                  className="absolute left-0 right-0 bg-blue-100 border border-blue-300 rounded px-2 py-1"
                  style={{
                    top: `${position.top}px`,
                    height: `${position.height}px`
                  }}
                >
                  <div className="text-xs">
                    <div className="font-semibold text-blue-800">
                      {scan.scanType}
                    </div>
                    <div className="text-blue-600 flex items-center justify-between">
                      <span>{scan.startTime} - {scan.endTime}</span>
                      <span className="ml-2">
                        {scan.bookedSlots}/{scan.totalSlots}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyTimelineView;
