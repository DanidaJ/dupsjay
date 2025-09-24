import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Keycloak login page where users can reset their password
    // Keycloak handles password reset functionality
    navigate('/login');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Redirecting to Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Password reset is handled through Keycloak. Redirecting to login page...
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
