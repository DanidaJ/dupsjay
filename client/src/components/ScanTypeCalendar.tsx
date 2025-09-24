import React, { useState, useEffect } from 'react';
import axios from 'axios';
import keycloakService from '../services/keycloakService';
import { useToast } from '../contexts/ToastContext';

interface AvailableDate {
  date: string;
  displayDate: string;
  dayName: string;
  totalAvailableSlots: number;
  scans: Array<{
    _id: string;
    startTime: string;
    endTime: string;
    availableSlots: number;
    totalSlots: number;
  }>;
}

interface ScanTypeCalendarProps {
  selectedScanType: string;
  onDateSelect: (date: AvailableDate) => void;
  onSlotSelect: (scan: any) => void;
}

const ScanTypeCalendar: React.FC<ScanTypeCalendarProps> = ({
  selectedScanType,
  onDateSelect,
  onSlotSelect
}) => {
  const { addToast } = useToast();
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (selectedScanType) {
      fetchAvailableDates();
    } else {
      setAvailableDates([]);
      setSelectedDate(null);
    }
  }, [selectedScanType]);

  const fetchAvailableDates = async () => {
    setLoading(true);
    try {
      const token = keycloakService.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/scans/available-dates/${selectedScanType}`,
        { headers }
      );
      
      console.log('Available dates response:', response.data);
      setAvailableDates(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching available dates:', error);
      addToast({ 
        message: 'Error fetching available dates', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: AvailableDate) => {
    setSelectedDate(date.date);
    onDateSelect(date);
  };

  const handleSlotClick = (scan: any, date: AvailableDate) => {
    const slotInfo = {
      scanId: scan._id,
      scanType: selectedScanType,
      date: date.date,
      startTime: scan.startTime,
      endTime: scan.endTime,
      availableSlots: scan.availableSlots,
      totalSlots: scan.totalSlots
    };
    onSlotSelect(slotInfo);
  };

  if (!selectedScanType) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">Select a Scan Type</p>
          <p>Choose a scan type from the dropdown above to view available appointment dates.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading available dates...</span>
        </div>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">No Available Dates</p>
          <p>There are currently no available appointments for {selectedScanType} scans in the next 3 months.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Available Dates for {selectedScanType} Scans
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {availableDates.length} date{availableDates.length !== 1 ? 's' : ''} with available slots
        </p>
      </div>
      
      <div className="p-4">
        <div className="space-y-3">
          {availableDates.map((date) => (
            <div
              key={date.date}
              className={`border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedDate === date.date
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleDateClick(date)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{date.displayDate}</h4>
                    <p className="text-sm text-gray-500">
                      {date.totalAvailableSlots} slot{date.totalAvailableSlots !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
                
                {selectedDate === date.date && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Available Time Slots:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {date.scans.map((scan) => (
                        <button
                          key={scan._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlotClick(scan, date);
                          }}
                          className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition-colors duration-200 text-left"
                        >
                          <div className="font-medium">{scan.startTime} - {scan.endTime}</div>
                          <div className="text-xs">
                            {scan.availableSlots}/{scan.totalSlots} slots
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScanTypeCalendar;