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

  // Check if a time slot has a scan
  const getScanForTimeSlot = (time: string) => {
    return scans.filter(scan => {
      const slotMinutes = timeToMinutes(time);
      const scanStartMinutes = timeToMinutes(scan.startTime);
      const scanEndMinutes = timeToMinutes(scan.endTime);
      
      // Check if this time slot falls within the scan period
      return slotMinutes >= scanStartMinutes && slotMinutes < scanEndMinutes;
    });
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isStartOfScan = (time: string, scan: Scan) => {
    return time === scan.startTime;
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 rounded-lg border border-gray-200">
      <div className="sticky top-0 bg-white border-b border-gray-300 p-3 z-10">
        <h3 className="font-semibold text-gray-800 text-center">
          Daily Schedule
        </h3>
        <p className="text-xs text-gray-600 text-center mt-1">
          {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      <div className="p-2">
        {timeSlots.map((time) => {
          const scansAtTime = getScanForTimeSlot(time);
          const isHourMark = time.endsWith(':00');
          
          return (
            <div
              key={time}
              className={`relative flex items-center border-l-2 border-gray-300 pl-2 ${
                isHourMark ? 'h-8' : 'h-6'
              }`}
            >
              {/* Time label */}
              <div className={`w-16 text-xs ${isHourMark ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>
                {isHourMark ? time : ''}
              </div>
              
              {/* Timeline area */}
              <div className="flex-1 relative">
                {scansAtTime.length > 0 ? (
                  <div className="space-y-1">
                    {scansAtTime.map((scan) => {
                      const isStart = isStartOfScan(time, scan);
                      
                      return (
                        <div
                          key={scan._id}
                          className={`${
                            isStart 
                              ? 'bg-blue-100 border border-blue-300 rounded px-2 py-1' 
                              : 'bg-blue-50 border-l-2 border-blue-300 px-2'
                          }`}
                        >
                          {isStart && (
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
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`h-full ${isHourMark ? 'border-t border-gray-200' : ''}`}></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyTimelineView;
