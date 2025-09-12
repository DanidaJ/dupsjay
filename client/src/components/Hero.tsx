import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="flex flex-col items-center text-center gap-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold">
            Schedule Appointments with Ease
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-2xl">
            Book, manage, and track your appointments all in one place. Simple, fast, and convenient.
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/book" className="px-8 py-3 text-lg font-medium rounded-md bg-white text-blue-700 hover:bg-blue-50 transition-colors duration-200 shadow-md">
              Book an Appointment
            </Link>
            <button className="px-8 py-3 text-lg font-medium rounded-md bg-transparent border-2 border-white text-white hover:bg-white hover:bg-opacity-10 transition-colors duration-200">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;