import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SelectedSlot {
  scanId: string;
  scanType: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  availableSlots: number;
}

interface BookingModalProps {
  selectedSlot: SelectedSlot;
  onSubmit: (bookingData: {
    patientName: string;
    patientPhone: string;
    notes?: string;
    bookerName?: string;
    bookerUserId?: string;
  }) => void;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  selectedSlot,
  onSubmit,
  onClose
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    notes: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }

    if (!formData.patientPhone.trim()) {
      newErrors.patientPhone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.patientPhone.replace(/\s/g, ''))) {
      newErrors.patientPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        patientName: formData.patientName.trim(),
        patientPhone: formData.patientPhone.trim(),
        notes: formData.notes.trim() || undefined,
        bookerName: currentUser?.name || 'Anonymous User',
        bookerUserId: currentUser?.id
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Appointment Details</h3>
          <div className={`p-4 rounded-lg border-2 ${getScanTypeColor(selectedSlot.scanType)}`}>
            <div className="font-semibold text-lg mb-2">{selectedSlot.scanType}</div>
            <div className="space-y-1 text-sm">
              <div><strong>Date:</strong> {formatDate(selectedSlot.date)}</div>
              <div><strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</div>
              <div><strong>Duration:</strong> {selectedSlot.duration} minutes</div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Booker (Non-editable) */}
            <div>
              <label htmlFor="bookerName" className="block text-sm font-medium text-gray-700 mb-1">
                Booked By
              </label>
              <input
                type="text"
                id="bookerName"
                name="bookerName"
                value={currentUser?.name || 'Anonymous User'}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">This is the person making the booking</p>
            </div>

            {/* Patient Name */}
            <div>
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name *
              </label>
              <input
                type="text"
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.patientName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter the patient's full name"
              />
              {errors.patientName && (
                <p className="mt-1 text-sm text-red-600">{errors.patientName}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="patientPhone"
                name="patientPhone"
                value={formData.patientPhone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.patientPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
              {errors.patientPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.patientPhone}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional notes or special requirements..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </span>
              ) : (
                'Book Appointment'
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-xs text-gray-600">
            * Required fields. You will receive a confirmation email after booking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
