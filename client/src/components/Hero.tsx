import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Hero = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleBookAppointment = () => navigate('/book');

  return (
    <section className="flex-1 flex flex-col justify-center items-center bg-gradient-to-r from-blue-700 to-blue-500 text-white w-full">
      <div className="w-full max-w-screen-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-8">
          ULTRASOUND APPOINTMENT BOOKING SYSTEM
          <br />
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Department of Radiology and Imaging - DGH Horana
          </span>
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          {isLoggedIn ? (
            <Link
              to="/book"
              className="px-8 py-3 text-lg font-medium rounded-md bg-white text-blue-700 hover:bg-blue-50 transition-colors duration-200 shadow-md"
            >
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
    </section>
  );
};

export default Hero;
