import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

function OwnerDashboard() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    name: '', address: '', city: '', pincode: '', description: '', image_url: ''
  });

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const res = await api.get('/restaurants/owner/my-restaurant');
        setRestaurant(res.data);
        
        // Fetch menu for this restaurant
        const menuRes = await api.get(`/restaurants/${res.data.id}/menu`);
        // We flatten the category groupings for the simple dashboard view
        const flatItems = menuRes.data.reduce((acc, cat) => [...acc, ...cat.items], []);
        setMenu(flatItems);
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOwnerData();
  }, []);

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/restaurants', formData);
      setRestaurant(res.data);
      toast.success('Restaurant profile created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create profile');
    }
  };

  if (loading) return <div className="text-center py-20">Loading Dashboard...</div>;

  return (
    <div className="section-container py-12 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Owner Dashboard</h1>
      
      {!restaurant ? (
        <div className="card p-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Register Your Restaurant</h2>
          <form onSubmit={handleCreateRestaurant} className="space-y-4">
            <input type="text" placeholder="Restaurant Name" className="input-field" 
              onChange={e => setFormData({...formData, name: e.target.value})} required />
            <textarea placeholder="Description" className="input-field min-h-[100px]"
              onChange={e => setFormData({...formData, description: e.target.value})} />
            <input type="text" placeholder="Full Address" className="input-field" 
              onChange={e => setFormData({...formData, address: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="City" className="input-field" 
                onChange={e => setFormData({...formData, city: e.target.value})} required />
              <input type="text" placeholder="Pincode" className="input-field" 
                onChange={e => setFormData({...formData, pincode: e.target.value})} required />
            </div>
            <input type="text" placeholder="Image URL (optional)" className="input-field" 
              onChange={e => setFormData({...formData, image_url: e.target.value})} />
            <button type="submit" className="btn-primary w-full py-3">Create Restaurant</button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 border-r border-gray-200 pr-6">
            <div className="card p-4 rounded-xl mb-6">
              <h3 className="font-bold text-lg">{restaurant.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{restaurant.city}</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Status</p>
                <span className={`px-2 py-1 rounded text-xs font-bold ${restaurant.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {restaurant.is_open ? 'Accepting Orders' : 'Closed'}
                </span>
              </div>
            </div>
            
            <div className="text-sm font-medium text-gray-600 bg-primary-50 text-primary-600 p-3 rounded-xl cursor-not-allowed">
               Menu Management View
            </div>
          </div>
          
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Menu Items</h2>
              <button 
                onClick={() => toast('Menu addition form goes here (Phase 3 completion)')} 
                className="btn-primary text-sm !px-4 !py-2"
              >
                + Add New Item
              </button>
            </div>
            
            {menu.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                You haven't added any menu items yet.
              </div>
            ) : (
              <div className="space-y-4">
                {menu.map(item => (
                  <div key={item.id} className="card p-4 flex justify-between items-center rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div>
                        <h4 className="font-bold">{item.name}</h4>
                        <p className="text-sm text-gray-500 font-medium mt-1">₹{item.price}</p>
                      </div>
                    </div>
                    <div>
                      {!item.is_available && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 mr-3">Out of Stock</span>}
                      <button className="text-sm text-blue-600 font-medium hover:underline">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
