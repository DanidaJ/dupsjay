const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Create an Account",
      description: "Sign up for free and set up your profile with basic information.",
      color: "bg-blue-100 text-blue-800",
    },
    {
      number: "02",
      title: "Choose a Service",
      description: "Browse through our available services and select what you need.",
      color: "bg-blue-200 text-blue-800",
    },
    {
      number: "03",
      title: "Select Date & Time",
      description: "Pick a convenient date and time from available slots.",
      color: "bg-blue-300 text-blue-900",
    },
    {
      number: "04",
      title: "Confirm Booking",
      description: "Review your details and confirm your appointment.",
      color: "bg-blue-400 text-white",
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">
            Book your appointment in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className={`${step.color} rounded-lg p-8 h-full`}>
                <div className="text-3xl font-bold mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200">
            Get Started Now
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;