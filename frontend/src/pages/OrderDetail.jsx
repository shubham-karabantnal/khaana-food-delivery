import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const statusSteps = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.order);
        setItems(res.data.items);
        
        // Check if user already reviewed this order
        const reviewsRes = await api.get(`/reviews/restaurant/${res.data.order.restaurant_id}`);
        const existingReview = reviewsRes.data.find(r => r.order_id === id);
        if (existingReview) setHasReviewed(true);
      } catch (error) {
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        order_id: id,
        restaurant_id: order.restaurant_id,
        rating,
        comment
      });
      setHasReviewed(true);
      toast.success('Review submitted! Thank you.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="section-container py-20 text-center animate-pulse">Loading order...</div>;
  if (!order) return <div className="section-container py-20 text-center">Order not found</div>;

  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="section-container py-10 animate-fade-in max-w-3xl mx-auto">
      <Link to="/orders" className="text-sm text-primary-600 hover:underline mb-6 inline-block">← Back to Orders</Link>

      <div className="card p-8 rounded-2xl mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{order.restaurant_name}</h1>
            <p className="text-sm text-gray-400 mt-1">
              Ordered on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className="text-xl font-bold">₹{parseFloat(order.total_price).toFixed(2)}</span>
        </div>

        {/* Status Tracker */}
        {order.status !== 'cancelled' ? (
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded">
                <div className="h-full bg-primary-500 rounded transition-all duration-500"
                  style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                />
              </div>
              {statusSteps.map((step, i) => (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i <= currentStep ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i <= currentStep ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-2 font-medium capitalize ${i <= currentStep ? 'text-primary-600' : 'text-gray-400'}`}>
                    {step.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-center font-bold">
            ❌ This order has been cancelled
          </div>
        )}

        {/* Items */}
        <h3 className="font-bold text-lg mb-4">Items Ordered</h3>
        <div className="divide-y divide-gray-100">
          {items.map(item => (
            <div key={item.id} className="flex justify-between py-3">
              <div className="flex items-center gap-3">
                {item.item_image && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <img src={item.item_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <span className="font-medium">{item.item_name}</span>
                  <span className="text-gray-400 ml-2 text-sm">x{item.quantity}</span>
                </div>
              </div>
              <span className="font-bold">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Section */}
      {order.status === 'delivered' && (
        <div className="card p-8 rounded-2xl mb-8 animate-slide-up">
          <h3 className="text-xl font-bold mb-4">⭐ Rate your experience</h3>
          {hasReviewed ? (
            <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-xl text-center font-medium">
              You have already reviewed this order. Thank you!
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-transform hover:scale-125 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="How was the food and delivery? (optional)"
                className="input-field min-h-[100px]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="btn-primary w-full"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
