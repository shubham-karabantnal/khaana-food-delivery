import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function Checkout() {
  const { user, refreshCartCount } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  // New address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', street: '', city: '', pincode: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartRes, addrRes] = await Promise.all([
          api.get('/cart'),
          api.get('/addresses').catch(() => ({ data: [] }))
        ]);
        setCart(cartRes.data);
        setAddresses(addrRes.data || []);
        if (addrRes.data?.length > 0) setSelectedAddress(addrRes.data[0].id);
      } catch (error) {
        toast.error('Failed to load checkout data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/addresses', newAddress);
      setAddresses(prev => [...prev, res.data]);
      setSelectedAddress(res.data.id);
      setShowAddressForm(false);
      setNewAddress({ label: '', street: '', city: '', pincode: '' });
      toast.success('Address added!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      return toast.error('Please select or add a delivery address');
    }
    if (cart.items.length === 0) {
      return toast.error('Your cart is empty');
    }

    setPlacing(true);
    try {
      // 1. Group cart items by restaurant
      const restaurantIds = [...new Set(cart.items.map(i => i.restaurant_id))];
      
      for (const restId of restaurantIds) {
        // 2. Place order in our DB (starts as 'unpaid')
        const orderRes = await api.post('/orders/place', {
          restaurant_id: restId,
          address_id: selectedAddress
        });
        const orderId = orderRes.data.order_id;

        // 3. Payment By-pass: Auto-secure order without Razorpay popup
        toast.success(`Bill generated successfully for ${orderId.substring(0,8)}!`);
      }

      // Safely cleanup frontend cart and redirect
      await refreshCartCount();
      toast.success('Checkout completed! 🎉');
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="section-container py-20 text-center animate-pulse">Loading checkout...</div>;

  return (
    <div className="section-container py-10 animate-fade-in max-w-3xl mx-auto">
      <h1 className="font-display text-4xl font-extrabold gradient-text mb-10">Checkout</h1>

      {/* Delivery Address */}
      <div className="card p-6 rounded-2xl mb-8">
        <h2 className="text-xl font-bold mb-4">📍 Delivery Address</h2>

        {addresses.length > 0 ? (
          <div className="space-y-3 mb-4">
            {addresses.map(addr => (
              <label key={addr.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedAddress === addr.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input type="radio" name="address" value={addr.id}
                  checked={selectedAddress === addr.id}
                  onChange={() => setSelectedAddress(addr.id)}
                  className="accent-primary-500"
                />
                <div>
                  <span className="font-bold text-sm text-gray-700">{addr.label || 'Address'}</span>
                  <p className="text-sm text-gray-500">{addr.street}, {addr.city} - {addr.pincode}</p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-4">No saved addresses. Please add one below.</p>
        )}

        {!showAddressForm ? (
          <button onClick={() => setShowAddressForm(true)} className="text-sm text-primary-600 font-medium hover:underline">
            + Add New Address
          </button>
        ) : (
          <form onSubmit={handleAddAddress} className="space-y-3 mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Label (e.g. Home)" className="input-field"
                value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} />
              <input type="text" placeholder="Pincode" className="input-field" required
                value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} />
            </div>
            <input type="text" placeholder="Street Address" className="input-field" required
              value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} />
            <input type="text" placeholder="City" className="input-field" required
              value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
            <div className="flex gap-3">
              <button type="submit" className="btn-primary text-sm !px-4 !py-2">Save Address</button>
              <button type="button" onClick={() => setShowAddressForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Order Summary */}
      <div className="card p-6 rounded-2xl mb-8">
        <h2 className="text-xl font-bold mb-4">🧾 Order Summary</h2>
        <div className="divide-y divide-gray-100">
          {cart.items.map(item => (
            <div key={item.id} className="flex justify-between py-3">
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-400 ml-2">x{item.quantity}</span>
              </div>
              <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <hr className="my-4" />
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span>₹{cart.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={placing || cart.items.length === 0}
        className="btn-primary w-full py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {placing ? 'Placing Order...' : `Place Order • ₹${cart.total.toFixed(2)}`}
      </button>
    </div>
  );
}

export default Checkout;
