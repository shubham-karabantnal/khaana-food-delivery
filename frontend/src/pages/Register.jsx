import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlinePhone } from 'react-icons/hi';
import toast from 'react-hot-toast';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      // Navigate to OTP verification passing email in state
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (error) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in relative z-10">
      <div className="card w-full max-w-md p-8 relative overflow-hidden backdrop-blur-xl bg-white/90 border border-white/20 shadow-2xl rounded-3xl">
        {/* Background glow effects */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-accent-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10 text-center mb-8">
          <span className="text-4xl mb-2 inline-block animate-slide-up">🚀</span>
          <h2 className="font-display text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">Join Khaana to start ordering</p>
        </div>

        <form className="relative z-10 space-y-4" onSubmit={handleSubmit}>
          
          {/* Role Selection Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'customer' })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${formData.role === 'customer' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'restaurant_owner' })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${formData.role === 'restaurant_owner' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Restaurant Owner
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlineUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                required
                className="input-field pl-11"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlinePhone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                name="phone"
                className="input-field pl-11"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                required
                minLength="6"
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
            className={`btn-primary w-full flex justify-center py-3.5 text-base mt-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="relative z-10 mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
