import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminScanManager from '../components/AdminScanManager';

const AdminScanPage: React.FC = () => {
  const { currentUser } = useAuth();

  // Check if user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AdminScanManager />
    </div>
  );
};

export default AdminScanPage;
