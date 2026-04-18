import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HiTrash, HiPlus, HiMinus, HiArrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';

function Cart() {
  const { user, refreshCartCount } = useAuth();
  const navigate = useNavigate();
  const [cartData, setCartData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/cart');
      setCartData(res.data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateQty = async (cartId, newQty) => {
    if (newQty < 1) return removeItem(cartId);
    try {
      await api.put(`/cart/${cartId}`, { quantity: newQty });
      fetchCart();
      refreshCartCount();
    } catch { toast.error('Update failed'); }
  };

  const removeItem = async (cartId) => {
    try {
      await api.delete(`/cart/${cartId}`);
      toast.success('Item removed');
      fetchCart();
      refreshCartCount();
    } catch { toast.error('Remove failed'); }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      toast.success('Cart cleared');
      fetchCart();
      refreshCartCount();
    } catch { toast.error('Failed to clear cart'); }
  };

  if (!user) {
    return (
      <div className="section-container py-20 text-center">
        <span className="text-6xl mb-4 block">🛒</span>
        <h2 className="text-2xl font-bold mb-4">Please log in to view your cart</h2>
        <Link to="/login" className="btn-primary">Log In</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="section-container py-20 text-center text-gray-400 animate-pulse text-lg">Loading cart...</div>;
  }

  const { items, total } = cartData;

  // Group items by restaurant for checkout clarity
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.restaurant_id]) {
      acc[item.restaurant_id] = { name: item.restaurant_name, items: [] };
    }
    acc[item.restaurant_id].items.push(item);
    return acc;
  }, {});

  return (
    <div className="section-container py-10 animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <h1 className="font-display text-4xl font-extrabold gradient-text">Your Cart</h1>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <span className="text-6xl mb-4 block">🛒</span>
          <h3 className="text-xl font-bold text-gray-800">Your cart is empty</h3>
          <p className="text-gray-500 mt-2 mb-6">Add some delicious items from our restaurants!</p>
          <Link to="/restaurants" className="btn-primary">Browse Restaurants</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(grouped).map(([restId, group]) => (
              <div key={restId} className="card rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-700">{group.name}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {group.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        {item.image_url && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500 mt-0.5">₹{item.price} each</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="px-3 py-2 hover:bg-gray-200 transition-colors">
                            <HiMinus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="px-3 py-2 hover:bg-gray-200 transition-colors">
                            <HiPlus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-bold text-gray-900 w-20 text-right">₹{(item.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1">
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 rounded-2xl sticky top-24">
              <h3 className="font-bold text-xl mb-6">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
              >
                Proceed to Checkout <HiArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
