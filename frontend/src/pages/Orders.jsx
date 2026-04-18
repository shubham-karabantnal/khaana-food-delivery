import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusEmojis = {
  pending: '⏳',
  confirmed: '✅',
  preparing: '👨‍🍳',
  out_for_delivery: '🚗',
  delivered: '🎉',
  cancelled: '❌',
};

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (error) {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
    else setLoading(false);
  }, [user]);

  if (!user) {
    return (
      <div className="section-container py-20 text-center">
        <span className="text-6xl mb-4 block">📋</span>
        <h2 className="text-2xl font-bold mb-4">Please log in to view your orders</h2>
        <Link to="/login" className="btn-primary">Log In</Link>
      </div>
    );
  }

  if (loading) return <div className="section-container py-20 text-center animate-pulse text-lg text-gray-400">Loading orders...</div>;

  return (
    <div className="section-container py-10 animate-fade-in">
      <h1 className="font-display text-4xl font-extrabold gradient-text mb-10">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <span className="text-6xl mb-4 block">📋</span>
          <h3 className="text-xl font-bold text-gray-800">No orders yet</h3>
          <p className="text-gray-500 mt-2 mb-6">Your order history will appear here</p>
          <Link to="/restaurants" className="btn-primary">Order Now</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`}
              className="card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {order.restaurant_image ? (
                    <img src={order.restaurant_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-primary-600 transition-colors">{order.restaurant_name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusEmojis[order.status]} {order.status.replace('_', ' ')}
                </span>
                <span className="font-bold text-lg text-gray-900">₹{parseFloat(order.total_price).toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
