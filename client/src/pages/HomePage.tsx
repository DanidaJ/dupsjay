import Hero from '../components/Hero';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;