import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  pending          : { label: "Accept Order",     color: "bg-yellow-500 hover:bg-yellow-600" },
  confirmed        : { label: "Start Preparing",  color: "bg-blue-500 hover:bg-blue-600"   },
  preparing        : { label: "Out for Delivery", color: "bg-purple-500 hover:bg-purple-600" },
  out_for_delivery : { label: "Mark Delivered",   color: "bg-green-500 hover:bg-green-600"  },
  delivered        : { label: "Completed",        color: "bg-gray-400"   },
};

function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/restaurant');
      setOrders(res.data);
    } catch (error) {
      toast.error('Failed to load restaurant orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/status`);
      toast.success('Order status updated!');
      fetchOrders(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) return <div className="section-container py-20 text-center animate-pulse">Loading orders...</div>;

  return (
    <div className="section-container py-12 animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incoming Orders</h1>
          <p className="text-gray-500">Manage active orders from your customers</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Auto-refreshing
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card p-20 text-center bg-gray-50 rounded-3xl border-dashed border-2 border-gray-200">
          <p className="text-4xl mb-4">🔔</p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No active orders</h3>
          <p className="text-gray-500">When customers place orders, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div key={order.id} className="card p-6 flex flex-col justify-between hover:shadow-xl transition-all border border-gray-100">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{order.customer_name}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                      #{order.id.substring(0, 8)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name} <span className="text-xs font-bold text-gray-400">x{item.quantity}</span></span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-gray-400">Total Price</span>
                  <span className="font-bold text-gray-900">₹{order.total_price}</span>
                </div>
                
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id)}
                    className={`w-full text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 ${STATUS_LABELS[order.status]?.color}`}
                  >
                    {STATUS_LABELS[order.status]?.label} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OwnerOrders;
