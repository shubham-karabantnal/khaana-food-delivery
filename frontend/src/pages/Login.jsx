import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import toast from 'react-hot-toast';

function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent logged in users from seeing login page
  if (!loading && localStorage.getItem('token')) {
    navigate('/');
    return null;
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login(formData.email, formData.password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'restaurant_owner') navigate('/owner/dashboard');
      else navigate('/');
    } catch (error) {
      // If user is not verified, redirect to OTP page
      if (error.response?.data?.notVerified) {
        navigate('/verify-otp', { state: { email: error.response.data.email } });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in relative z-10 w-full max-w-md mx-auto">
      <div className="card w-full p-8 relative overflow-hidden backdrop-blur-xl bg-white/90 border border-white/20 shadow-2xl rounded-3xl">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-100 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10 text-center mb-8">
          <span className="text-4xl mb-2 inline-block animate-pulse-slow">👋</span>
          <h2 className="font-display text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to order your favorite khaana</p>
        </div>

        <form className="relative z-10 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlineMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                required
                className="input-field pl-11"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Link to="/forgot-password" size="sm" className="text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                required
                className="input-field pl-11"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn-primary w-full flex justify-center py-3.5 text-base ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative z-10 mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
