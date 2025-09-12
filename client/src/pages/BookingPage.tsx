import React from 'react';
import UserBookingManager from '../components/UserBookingManager';

const BookingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book Your Scan Appointment</h1>
          <p className="mt-2 text-gray-600">Select an available time slot that works for you</p>
        </div>
        <UserBookingManager />
      </div>
    </div>
  );
};

export default BookingPage;
