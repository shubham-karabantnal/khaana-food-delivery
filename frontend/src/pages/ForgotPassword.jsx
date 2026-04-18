import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiOutlineArrowLeft } from 'react-icons/hi';
import api from '../services/api';
import toast from 'react-hot-toast';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message);
      // Navigate to reset password page, passing email in state
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in relative z-10">
      <div className="card w-full max-w-md p-8 relative overflow-hidden backdrop-blur-xl bg-white/90 border border-white/20 shadow-2xl rounded-3xl">
        {/* Background glow effects */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent-100 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10">
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors mb-6 group">
            <HiOutlineArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" />
            Back to login
          </Link>

          <div className="text-center mb-8">
            <span className="text-4xl mb-2 inline-block">🔑</span>
            <h2 className="font-display text-3xl font-extrabold text-gray-900">Forgot Password?</h2>
            <p className="text-gray-500 mt-2">Enter your email and we'll send you a 6-digit code to reset your password.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiOutlineMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field pl-11"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn-primary w-full flex justify-center py-3.5 text-base ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Sending code...' : 'Send Reset Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
