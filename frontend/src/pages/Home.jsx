import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight, HiOutlineSearch, HiOutlineClock, HiOutlineShieldCheck, HiOutlineTrendingUp, HiOutlineUsers } from 'react-icons/hi';
import api from '../services/api';

function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
    
    // Refresh stats every 3 seconds to show live changes
    const intervalId = setInterval(fetchStats, 3000);
    return () => clearInterval(intervalId);
  }, []);
  const features = [
    {
      icon: <HiOutlineSearch className="w-8 h-8" />,
      title: 'Browse Restaurants',
      desc: 'Explore menus from the best restaurants near your campus.',
    },
    {
      icon: <HiOutlineClock className="w-8 h-8" />,
      title: 'Quick Ordering',
      desc: 'Add to cart and place orders in seconds with one-click checkout.',
    },
    {
      icon: <HiOutlineShieldCheck className="w-8 h-8" />,
      title: 'Secure Payments',
      desc: 'Pay securely via Razorpay with instant confirmation.',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* ─── Hero Section ─────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center pt-28 pb-20 overflow-hidden">
        {/* Background blobs for depth */}
        <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-[150px] animate-pulse-slow"></div>

        <div className="section-container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-slide-up text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              <span className="text-xs font-bold text-primary-700 uppercase tracking-[0.2em]">Premium Food Delivery</span>
            </div>
            
            <h1 className="font-display text-7xl lg:text-8xl leading-[1.05] font-black text-gray-900 mb-8">
               Gourmet <br />
              <span className="gradient-text">Experiences</span>
            </h1>
            
            <p className="text-xl text-gray-500 mb-12 leading-relaxed max-w-lg">
              Discover the most exquisite flavors from your city's finest restaurants, 
              curated for those who appreciate the art of dining.
            </p>

            <div className="flex flex-wrap gap-6">
              <Link to="/restaurants" className="btn-primary flex items-center gap-3">
                Explore Cuisines <HiArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register" className="btn-secondary">
                Join the Circle
              </Link>
            </div>

            <div className="mt-16 flex items-center gap-12 border-t border-gray-100 pt-10">
              <div className="text-left">
                <span className="block text-3xl font-black text-gray-900 leading-none mb-1">30+</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Elite Venues</span>
              </div>
              <div className="text-left">
                <span className="block text-3xl font-black text-gray-900 leading-none mb-1">12k+</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Regular Gourmets</span>
              </div>
              <div className="text-left">
                <span className="block text-3xl font-black text-gray-900 leading-none mb-1">4.9/5</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">User Rating</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in delay-200">
            {/* Main Image with geometric background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-accent-500/20 rounded-[4rem] blur-2xl transform rotate-3"></div>
            <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white transform hover:scale-[1.03] transition-transform duration-700 shadow-indigo-900/20">
              <img 
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200" 
                alt="Fine Dining" 
                className="w-full h-[650px] object-cover"
              />
            </div>
            
            {/* Floating Glass Widgets */}
            <div className="absolute -bottom-12 -left-12 glass p-6 rounded-[2.5rem] z-20 max-w-[260px] shadow-2xl animate-bounce-slow border border-white/40">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl shadow-lg shadow-primary-500/30">✨</div>
                <div>
                  <p className="text-sm font-black text-gray-900 leading-tight">Elite Delivery</p>
                  <p className="text-xs font-medium text-gray-500">Excellence guaranteed</p>
                </div>
              </div>
            </div>

            <div className="absolute top-10 -right-10 glass px-6 py-4 rounded-[2rem] z-20 shadow-2xl border border-white/40 animate-pulse-slow">
              <p className="text-sm font-black text-primary-600">Active Now 🛵</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Live Stats Banner ────────────────────────────── */}
      {stats && (
        <div className="bg-white border-b border-gray-100 shadow-sm py-10 transition-all">
          <div className="section-container">
            <div className="flex flex-col md:flex-row justify-around items-center gap-8">
              <div className="text-center group">
                <div className="flex items-center justify-center gap-2 text-primary-500 mb-2">
                  <HiOutlineTrendingUp className="w-6 h-6" />
                  <span className="text-sm font-bold uppercase tracking-wider">Active Deliveries</span>
                </div>
                <div className="text-5xl font-display font-black text-gray-900 group-hover:scale-110 transition-transform duration-300">
                  {stats.activeDeliveries.toLocaleString()}
                </div>
              </div>
              <div className="w-full md:w-px h-px md:h-16 bg-gray-200"></div>
              <div className="text-center group">
                <div className="flex items-center justify-center gap-2 text-accent-500 mb-2">
                  <HiOutlineUsers className="w-6 h-6" />
                  <span className="text-sm font-bold uppercase tracking-wider">Active Users</span>
                </div>
                <div className="text-5xl font-display font-black text-gray-900 group-hover:scale-110 transition-transform duration-300">
                  {stats.activeUsers.toLocaleString()}
                </div>
              </div>
              <div className="w-full md:w-px h-px md:h-16 bg-gray-200"></div>
              <div className="text-center group">
                <div className="flex items-center justify-center gap-2 text-green-500 mb-2">
                  <span className="text-xl">🏪</span>
                  <span className="text-sm font-bold uppercase tracking-wider">Online Outlets</span>
                </div>
                <div className="text-5xl font-display font-black text-gray-900 group-hover:scale-110 transition-transform duration-300">
                  {stats.restaurantsOnline}+
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Features Section ─────────────────────────────── */}
      <section className="section-container py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Three simple steps to get your favorite food delivered
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="card p-8 text-center group hover:-translate-y-2 cursor-default"
            >
              <div className="w-16 h-16 mx-auto mb-5 bg-primary-50 text-primary-500 rounded-2xl
                            flex items-center justify-center
                            group-hover:bg-primary-500 group-hover:text-white
                            transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                {feature.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────── */}
      <section className="section-container pb-20">
        <div className="bg-gradient-to-r from-dark-900 to-dark-800 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to order?
            </h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Join Khaana today and start ordering from the best restaurants around you.
            </p>
            <Link
              to="/register"
              className="btn-primary inline-block text-lg !py-4 !px-10 !rounded-2xl"
            >
              Get Started — It's Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
