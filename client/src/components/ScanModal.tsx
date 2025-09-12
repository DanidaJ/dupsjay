import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';

interface ScanType {
  _id: string;
  name: string;
  duration: number;
}

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (scanData: any) => void;
  scanTypes: string[];
  selectedSlot: {
    day: string;
    time: string;
    date: string;
  };
}

const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  scanTypes,
  selectedSlot
}) => {
  const [formData, setFormData] = useState({
    scanType: '',
    startTime: selectedSlot.time,
    endTime: '',
    duration: 0,
    totalSlots: 1,
    notes: ''
  });
  const [scanTypeDetails, setScanTypeDetails] = useState<ScanType[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch scan type details on component mount
  useEffect(() => {
    if (isOpen) {
      fetchScanTypeDetails();
    }
  }, [isOpen]);

  const fetchScanTypeDetails = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/scans/scan-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScanTypeDetails(response.data.data || []);
    } catch (error) {
      console.error('Error fetching scan type details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scanData = {
      ...formData,
      date: selectedSlot.date
    };
    
    onSubmit(scanData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'scanType') {
      // Find the selected scan type and get its duration
      const selectedScanType = scanTypeDetails.find(st => st.name === value);
      const duration = selectedScanType ? selectedScanType.duration : 0;
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        duration: duration
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: (name === 'totalSlots') ? parseInt(value) : value
      }));
    }
  };

  const calculateEndTime = (startTime: string, duration: number, totalSlots: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (duration * totalSlots);
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  React.useEffect(() => {
    if (formData.startTime && formData.duration && formData.totalSlots) {
      const endTime = calculateEndTime(formData.startTime, formData.duration, formData.totalSlots);
      setFormData(prev => ({ ...prev, endTime }));
    }
  }, [formData.startTime, formData.duration, formData.totalSlots]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Schedule Scan Sessions</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Setting up scans for:</strong> {selectedSlot.day}, {new Date(selectedSlot.date).toLocaleDateString()}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Choose the scan type and number of scans. The system will automatically calculate the duration and end time based on the scan type settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scan Type *
            </label>
            <select
              name="scanType"
              value={formData.scanType}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select scan type</option>
              {scanTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {formData.scanType && formData.duration > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Duration per scan: {formData.duration} minutes
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                When the first scan starts
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Scans *
              </label>
              <input
                type="number"
                name="totalSlots"
                value={formData.totalSlots}
                onChange={handleChange}
                min="1"
                max="50"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="How many scans?"
              />
              <p className="text-xs text-gray-500 mt-1">
                How many {formData.scanType || 'scans'} to schedule
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time (Calculated)
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                When the last scan ends
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Time Block
              </label>
              <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {formData.duration && formData.totalSlots ? 
                  `${formData.duration * formData.totalSlots} minutes` : 
                  'Select scan type and slots'
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total time for all scans
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional notes about the scan..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.scanType || !formData.duration}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Schedule {formData.totalSlots} {formData.scanType || 'Scan'}
              {formData.totalSlots > 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScanModal;
