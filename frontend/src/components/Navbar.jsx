import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineShoppingCart, HiOutlineMenu, HiOutlineX, HiOutlineUserCircle, HiOutlineLogout, HiOutlineLogin } from 'react-icons/hi';
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, cartCount, logout } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Restaurants', path: '/restaurants' },
    { name: 'Orders', path: '/orders' },
  ];

  if (user?.role === 'restaurant_owner') {
    navLinks.push({ name: 'Inventory', path: '/owner/dashboard' });
    navLinks.push({ name: 'Manage Orders', path: '/owner/orders' });
  }

  if (user?.role === 'admin') {
    navLinks.push({ name: 'Admin', path: '/admin/dashboard' });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm shadow-indigo-900/5">
      <div className="section-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xl shadow-lg shadow-primary-500/20 group-hover:rotate-12 transition-transform duration-300">
              <span className="mb-0.5 ml-0.5">🍛</span>
            </div>
            <span className="font-display text-3xl font-black tracking-tight gradient-text">
              Khaana
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${isActive(link.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/cart"
              className="relative p-2 rounded-xl hover:bg-primary-50 transition-all duration-300 group mr-2"
            >
              <HiOutlineShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-primary-600" />
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                  <HiOutlineUserCircle className="w-5 h-5 text-primary-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800 leading-tight">{user.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{user.role.replace('_', ' ')}</span>
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <HiOutlineLogout className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2">
                  <HiOutlineLogin className="w-4 h-4" />
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <HiOutlineX className="w-6 h-6 text-gray-600" />
            ) : (
              <HiOutlineMenu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-slide-up">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300
                    ${isActive(link.path)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="my-2 border-gray-100" />
              <div className="flex gap-2 px-4 pb-2">
                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full btn-secondary !py-2 !px-4 text-sm text-center flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:border-red-200"
                  >
                    <HiOutlineLogout className="w-4 h-4" /> Logout ({user.name.split(' ')[0]})
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="btn-secondary !py-2 !px-4 text-sm flex-1 text-center flex items-center justify-center gap-2"
                    >
                      <HiOutlineLogin className="w-4 h-4" />
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="btn-primary !py-2 !px-4 text-sm flex-1 text-center"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
