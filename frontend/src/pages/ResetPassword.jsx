import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineLockClosed, HiOutlineKey } from 'react-icons/hi';
import api from '../services/api';
import toast from 'react-hot-toast';

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    otp_code: '',
    new_password: '',
    confirm_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If we have email in navigation state (from ForgotPassword page)
    if (location.state?.email) {
      setFormData(prev => ({ ...prev, email: location.state.email }));
    }
  }, [location.state]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      return toast.error('Passwords do not match');
    }
    if (formData.new_password.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: formData.email,
        otp_code: formData.otp_code,
        new_password: formData.new_password
      });
      toast.success(res.data.message);
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Something went wrong');
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
          <span className="text-4xl mb-2 inline-block">🛠️</span>
          <h2 className="font-display text-3xl font-extrabold text-gray-900">Set New Password</h2>
          <p className="text-gray-500 mt-2">Enter the verification code and your new password.</p>
        </div>

        <form className="relative z-10 space-y-4" onSubmit={handleSubmit}>
          {!location.state?.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                className="input-field"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlineKey className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="otp_code"
                required
                className="input-field pl-11"
                placeholder="6-digit code"
                maxLength="6"
                value={formData.otp_code}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="new_password"
                required
                minLength="6"
                className="input-field pl-11"
                placeholder="••••••••"
                value={formData.new_password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="confirm_password"
                required
                minLength="6"
                className="input-field pl-11"
                placeholder="••••••••"
                value={formData.confirm_password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn-primary w-full flex justify-center py-3.5 text-base mt-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Updating password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
