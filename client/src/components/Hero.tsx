import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// ...existing code

const Hero = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  // toast not needed here; booking is public
  // const { addToast } = useToast();

  const handleBookAppointment = () => {
    // Booking is public; always navigate to booking page
    navigate('/book');
  };

  return (
    <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="flex flex-col items-center text-center gap-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
            ULTRASOUND APPOINTMENT BOOKING SYSTEM
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold">Department of Radiology and Imaging - DGH Horana</span>
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {isLoggedIn ? (
              <Link to="/book" className="px-8 py-3 text-lg font-medium rounded-md bg-white text-blue-700 hover:bg-blue-50 transition-colors duration-200 shadow-md">
                Book an Appointment
              </Link>
            ) : (
              <button 
                onClick={handleBookAppointment}
                className="px-8 py-3 text-lg font-medium rounded-md bg-white text-blue-700 hover:bg-blue-50 transition-colors duration-200 shadow-md"
              >
                Book an Appointment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;