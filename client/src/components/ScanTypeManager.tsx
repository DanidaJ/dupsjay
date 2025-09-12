import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { getToken } from '../services/authService';

interface ScanType {
  _id: string;
  name: string;
  duration: number;
  createdAt: string;
}

interface ScanTypeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanTypesUpdated: () => void;
}

const ScanTypeManager: React.FC<ScanTypeManagerProps> = ({
  isOpen,
  onClose,
  onScanTypesUpdated
}) => {
  const { addToast } = useToast();
  const [scanTypes, setScanTypes] = useState<ScanType[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    duration: 30
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchScanTypes();
    }
  }, [isOpen]);

  const fetchScanTypes = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/scans/scan-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScanTypes(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching scan types:', error);
      addToast({ message: 'Error fetching scan types', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast({ message: 'Scan type name is required', type: 'error' });
      return;
    }

    if (formData.duration < 5 || formData.duration > 300) {
      addToast({ message: 'Duration must be between 5 and 300 minutes', type: 'error' });
      return;
    }

    try {
      const token = getToken();
      
      if (editingId) {
        // Update existing scan type
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/scans/scan-types/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        addToast({ message: 'Scan type updated successfully', type: 'success' });
      } else {
        // Create new scan type
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/scans/scan-types`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        addToast({ message: 'Scan type created successfully', type: 'success' });
      }

      setFormData({ name: '', duration: 30 });
      setEditingId(null);
      fetchScanTypes();
      onScanTypesUpdated();
    } catch (error: any) {
      console.error('Error saving scan type:', error);
      addToast({ 
        message: error.response?.data?.message || 'Error saving scan type', 
        type: 'error' 
      });
    }
  };

  const handleEdit = (scanType: ScanType) => {
    setFormData({
      name: scanType.name,
      duration: scanType.duration
    });
    setEditingId(scanType._id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this scan type? This action cannot be undone.')) {
      try {
        const token = getToken();
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/scans/scan-types/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        addToast({ message: 'Scan type deleted successfully', type: 'success' });
        fetchScanTypes();
        onScanTypesUpdated();
      } catch (error: any) {
        console.error('Error deleting scan type:', error);
        addToast({ 
          message: error.response?.data?.message || 'Error deleting scan type', 
          type: 'error' 
        });
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', duration: 30 });
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Manage Scan Types</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Add/Edit Form */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Scan Type' : 'Add New Scan Type'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scan Type Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., MRI Brain, CT Scan, X-Ray"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="5"
                    max="300"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Update Scan Type' : 'Add Scan Type'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Scan Types List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Existing Scan Types</h3>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : scanTypes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No scan types found. Add your first scan type above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scanTypes.map((scanType) => (
                  <div
                    key={scanType._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800 flex-1">{scanType.name}</h4>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => handleEdit(scanType)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(scanType._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Duration: {scanType.duration} minutes</p>
                      <p className="text-xs mt-1">
                        Created: {new Date(scanType.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanTypeManager;
