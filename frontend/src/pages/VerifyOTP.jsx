import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineKey } from 'react-icons/hi';
import api from '../services/api';
import toast from 'react-hot-toast';

function VerifyOTP() {
  const { verifyOTP } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from router state (passed from Register page)
  const userEmail = location.state?.email || '';
  
  const [formData, setFormData] = useState({ email: userEmail, otp_code: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60s cooldown for resend

  useEffect(() => {
    // If no email was passed, redirect back to register
    if (!userEmail) {
      toast.error('Please register or login first');
      navigate('/register');
    }
  }, [userEmail, navigate]);

  useEffect(() => {
    // Simple cooldown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await verifyOTP(formData.email, formData.otp_code);
      // Successful verification -> go to login
      navigate('/login');
    } catch (error) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email: formData.email });
      toast.success('A new OTP has been sent to your email.');
      setTimeLeft(60); // Reset timer
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in relative z-10">
      <div className="card w-full max-w-md p-8 text-center relative overflow-hidden backdrop-blur-xl bg-white/90 border border-white/20 shadow-2xl rounded-3xl">
        
        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <HiOutlineKey className="w-10 h-10 text-primary-500 animate-pulse-slow" />
        </div>
        
        <h2 className="font-display text-3xl font-extrabold text-gray-900 mb-2">Verify Email</h2>
        <p className="text-gray-500 text-sm mb-8 px-4">
          We've sent a 6-digit verification code to <span className="font-semibold text-gray-800">{userEmail}</span>. Enter it below to activate your account.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <div className="relative">
              <input
                type="text"
                name="otp_code"
                required
                maxLength="6"
                className="input-field text-center tracking-[0.5em] text-2xl font-bold py-4"
                placeholder="••••••"
                value={formData.otp_code}
                onChange={handleChange}
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || formData.otp_code.length < 6}
            className={`btn-primary w-full py-4 text-lg ${
              (isSubmitting || formData.otp_code.length < 6) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>

        <div className="mt-8 text-sm text-gray-600">
          Didn't receive the code?{' '}
          <button 
            type="button"
            onClick={handleResend}
            disabled={timeLeft > 0 || isResending}
            className={`font-semibold transition-colors ${
              timeLeft > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-500'
            }`}
          >
            {isResending ? 'Sending...' : timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;
