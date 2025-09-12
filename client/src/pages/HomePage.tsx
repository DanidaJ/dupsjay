import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { isLoggedIn, currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <main>
        {isLoggedIn && currentUser && (
          <div className="bg-blue-50 border-b border-blue-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
              <p className="text-blue-800">
                Welcome back, <span className="font-medium">{currentUser.name}</span>! 
              </p>
              <Link 
                to="/profile" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Profile →
              </Link>
            </div>
          </div>
        )}
        <Hero />
        
        {/* Statistics Section */}
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600">10k+</div>
                <div className="mt-2 text-gray-600">Appointments Booked</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600">500+</div>
                <div className="mt-2 text-gray-600">Happy Clients</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600">99%</div>
                <div className="mt-2 text-gray-600">Customer Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600">24/7</div>
                <div className="mt-2 text-gray-600">Online Booking</div>
              </div>
            </div>
          </div>
        </section>
        
        <Features />
        <HowItWorks />
        
        {/* Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Our Clients Say
              </h2>
              <p className="max-w-2xl mx-auto text-xl text-gray-500">
                Trusted by individuals and businesses across the country
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  content: "The booking process was seamless! I love how I can schedule appointments anytime, anywhere. The reminders are also super helpful.",
                  author: "Sarah Johnson",
                  role: "Regular Customer"
                },
                {
                  content: "As a busy professional, I appreciate how quick and easy it is to book appointments. The interface is intuitive and user-friendly.",
                  author: "Michael Chen",
                  role: "Business Owner"
                },
                {
                  content: "I've been using this system for the past 6 months and it's been a game-changer for me. No more phone calls or waiting on hold!",
                  author: "Emily Rodriguez",
                  role: "Freelancer"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <svg className="h-8 w-8 text-blue-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-gray-600 mb-4">{testimonial.content}</p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-lg font-semibold">{testimonial.author.charAt(0)}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="bg-blue-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to simplify your appointment booking?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Join thousands of satisfied customers who have made booking appointments a breeze with our system.
              </p>
              <button className="inline-block px-8 py-3 text-lg font-medium rounded-md bg-white text-blue-600 hover:bg-blue-50 transition-colors duration-200">
                Get Started for Free
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;