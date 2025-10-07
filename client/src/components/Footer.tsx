const Footer = () => {
  return (
 <footer className="bg-blue-800 text-white w-full">
  <div className="w-full max-w-5xl mx-auto py-6 px-4 box-border">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <span className="text-2xl font-bold">DUPSJay</span>
        <p className="mt-2 text-blue-100">
          Making appointment booking simple and efficient.
        </p>
      </div>
    </div>
    <div className="mt-6 pt-2 flex flex-col md:flex-row justify-between items-center">
      <p className="text-base text-blue-100">
        © 2025 Nerdtastic🧠™ by Danida Jayakody 
      </p>
      <p className="text-sm text-blue-200 mt-4 md:mt-0">
        DUPSJay is a project by Nerdtastic🧠™ | All rights reserved.
      </p>
    </div>
  </div>
</footer>

  );
};

export default Footer;