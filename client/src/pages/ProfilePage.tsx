import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Spinner from '../components/Spinner';

const ProfilePage = () => {
  const { currentUser, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [loading, setLoading] = useState(false);

  // Format date to be readable
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      // This is a placeholder for actual API call
      // You would implement this in your authService.ts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulating a successful update
      await refreshUser();
      
      addToast({
        type: 'success',
        message: 'Profile updated successfully!'
      });
      
      setIsEditing(false);
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to update profile. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">User Profile</h1>
          
          <div className="mb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-2xl font-bold">
                  {currentUser?.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            {isEditing ? (
              <div className="text-center">
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
            ) : (
              <>
                <p className="text-center text-lg font-medium text-gray-900">{currentUser?.name}</p>
                <p className="text-center text-gray-500">{currentUser?.email}</p>
              </>
            )}
          </div>
          
          <div className="border-t border-gray-200 py-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Account Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{currentUser?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{currentUser?.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Account Created</p>
                <p className="font-medium">{formatDate(currentUser?.createdAt)}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            {isEditing ? (
              <div className="space-y-3">
                <button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Spinner size={18} className="mr-2" /> Saving...
                    </span>
                  ) : 'Save Changes'}
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setName(currentUser?.name || '');
                  }}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Profile
              </button>
            )}
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Account Settings</h2>
            <button 
              className="w-full mt-2 py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
