import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : currentUser?.email?.split('@')[0];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600">DUPSJay</span>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <NavLink to="/" className={({ isActive }) =>
                `px-3 pt-5 pb-3 transition-colors duration-200 ${isActive ? 'text-blue-800 font-medium border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-800 hover:border-b-2 hover:border-blue-500'}`
              } end>
                Home
              </NavLink>
              <NavLink to="/book" className={({ isActive }) =>
                `px-3 pt-5 pb-3 transition-colors duration-200 ${isActive ? 'text-blue-800 font-medium border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-800 hover:border-b-2 hover:border-blue-500'}`
              }>
                Book
              </NavLink>
              <NavLink to="/about" className={({ isActive }) =>
                `px-3 pt-5 pb-3 transition-colors duration-200 ${isActive ? 'text-blue-800 font-medium border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-800 hover:border-b-2 hover:border-blue-500'}`
              }>
                About
              </NavLink>
              <NavLink to="/contact" className={({ isActive }) =>
                `px-3 pt-5 pb-3 transition-colors duration-200 ${isActive ? 'text-blue-800 font-medium border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-800 hover:border-b-2 hover:border-blue-500'}`
              }>
                Contact
              </NavLink>
            </div>
          </div>

          <div className="hidden md:flex items-center">
            {isLoggedIn ? (
              <>
                <span className="ml-6 text-gray-700">Hi, {firstName}</span>
                <NavLink to="/profile" className={({ isActive }) => `ml-4 px-3 py-1 rounded text-gray-700 hover:text-blue-800 ${isActive ? 'text-blue-800 font-medium' : ''}`}>
                  Profile
                </NavLink>
                <NavLink to="/book" className={({ isActive }) => `ml-4 px-3 py-1 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-800'}`}>
                  Book
                </NavLink>
                {currentUser?.role === 'admin' && (
                  <>
                    <NavLink to="/admin/scans" className={({ isActive }) => `ml-4 px-3 py-1 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-700'}`}>
                      Scans
                    </NavLink>
                    <NavLink to="/admin/make-admins" className={({ isActive }) => `ml-4 px-3 py-1 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-700'}`}>
                      Admins
                    </NavLink>
                  </>
                )}
                <button 
                  onClick={() => {
                    logout();
                    addToast({
                      type: 'info',
                      message: 'You have been logged out successfully'
                    });
                    navigate('/');
                  }}
                  className="ml-4 px-3 py-1 rounded bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => `ml-6 px-3 py-1 rounded text-gray-700 hover:text-blue-800 ${isActive ? 'text-blue-800 font-medium' : ''}`}>
                  Log In
                </NavLink>
                <NavLink to="/book" className={({ isActive }) => `ml-4 px-3 py-1 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-800'}`}>
                  Book
                </NavLink>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
            {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <NavLink to="/" end className={({ isActive }) => `block pl-3 pr-4 py-2 text-base font-medium ${isActive ? 'bg-blue-50 text-blue-800' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-800'}`}>
              Home
            </NavLink>
            <NavLink to="/book" className={({ isActive }) => `block pl-3 pr-4 py-2 text-base font-medium ${isActive ? 'bg-blue-50 text-blue-800' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-800'}`}>
              Book
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => `block pl-3 pr-4 py-2 text-base font-medium ${isActive ? 'bg-blue-50 text-blue-800' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-800'}`}>
              About
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => `block pl-3 pr-4 py-2 text-base font-medium ${isActive ? 'bg-blue-50 text-blue-800' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-800'}`}>
              Contact
            </NavLink>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 flex flex-col space-y-2 px-4">
            {isLoggedIn ? (
              <>
                <span className="text-gray-700 text-center font-medium">Hi, {firstName}</span>
                <NavLink to="/profile" className={({ isActive }) => `px-4 py-2 rounded text-center ${isActive ? 'text-blue-800 font-medium' : 'text-gray-700 hover:text-blue-800'}`}>
                  Profile
                </NavLink>
                <NavLink to="/book" className={({ isActive }) => `px-4 py-2 rounded text-center ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-800'}`}>
                  Book
                </NavLink>
                {currentUser?.role === 'admin' && (
                  <>
                    <NavLink to="/admin/scans" className={({ isActive }) => `px-4 py-2 rounded text-center ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-700'}`}>
                      Scans
                    </NavLink>
                    <NavLink to="/admin/make-admins" className={({ isActive }) => `px-4 py-2 rounded text-center ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-700'}`}>
                      Admins
                    </NavLink>
                  </>
                )}
                <button 
                  onClick={() => {
                    logout();
                    addToast({
                      type: 'info',
                      message: 'You have been logged out successfully'
                    });
                    setIsMenuOpen(false);
                    navigate('/');
                  }}
                  className="px-4 py-2 rounded bg-white border border-blue-600 text-blue-600 text-center"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => `px-4 py-2 rounded text-center ${isActive ? 'text-blue-800 font-medium' : 'text-gray-700 hover:text-blue-800'}`}>
                  Log In
                </NavLink>
                <NavLink to="/book" className={({ isActive }) => `px-4 py-2 rounded text-center ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-800'}`}>
                  Book
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;