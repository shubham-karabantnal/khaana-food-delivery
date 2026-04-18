import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HiOutlineLocationMarker, HiStar, HiPlus, HiMinus } from 'react-icons/hi';
import toast from 'react-hot-toast';

function RestaurantDetail() {
  const { id } = useParams();
  const { refreshCartCount } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'reviews'
  
  // Local cart state for UI only. Phase 4 will persist this
  const [cartQuantities, setCartQuantities] = useState({});

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [restRes, menuRes, reviewsRes] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/restaurants/${id}/menu`),
          api.get(`/reviews/restaurant/${id}`)
        ]);
        setRestaurant(restRes.data);
        setMenuCategories(menuRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        toast.error('Failed to load restaurant details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const updateQuantity = (itemId, delta) => {
    setCartQuantities(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const handleAddToCart = async (itemId, qty) => {
    try {
      await api.post('/cart', { menu_item_id: itemId, quantity: qty });
      refreshCartCount();
      toast.success('Added to cart! 🛒');
      setCartQuantities(prev => ({ ...prev, [itemId]: 0 }));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Please log in to add items');
    }
  };

  if (loading) {
    return <div className="section-container py-12 text-center text-gray-500 animate-pulse">Loading menu...</div>;
  }

  if (!restaurant) {
    return <div className="section-container py-12 text-center">Restaurant not found</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Restaurant Hero Cover */}
      <div className="h-[40vh] w-full relative">
        <img 
          src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1920'} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full">
          <div className="section-container py-10 relative z-10 text-white">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${restaurant.is_open ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {restaurant.is_open ? 'Open Now' : 'Closed'}
                  </span>
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold">
                    <span>{parseFloat(restaurant.avg_rating).toFixed(1)}</span>
                    <HiStar className="w-4 h-4 text-yellow-400" />
                    <span className="font-normal text-white/80 ml-1">({restaurant.total_reviews})</span>
                  </div>
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold mb-2 drop-shadow-lg">
                  {restaurant.name}
                </h1>
                <p className="flex items-center text-gray-200 text-lg">
                  <HiOutlineLocationMarker className="w-5 h-5 mr-1" />
                  {restaurant.address}, {restaurant.city}
                </p>
                {restaurant.description && (
                  <p className="mt-4 text-gray-300 max-w-2xl text-sm leading-relaxed">
                    {restaurant.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
        <div className="section-container">
          <div className="flex gap-8 h-12">
            <button 
              onClick={() => setActiveTab('menu')}
              className={`text-sm font-bold uppercase tracking-wider border-b-2 transition-all px-2 ${activeTab === 'menu' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Menu
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`text-sm font-bold uppercase tracking-wider border-b-2 transition-all px-2 flex items-center gap-2 ${activeTab === 'reviews' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Reviews <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{reviews.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="section-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            {activeTab === 'menu' ? (
              <div className="space-y-12 animate-slide-up">
            {menuCategories.length === 0 ? (
              <div className="card p-12 text-center text-gray-500">
                Menu is currently empty.
              </div>
            ) : (
              menuCategories.map((category) => (
                <div key={category.category} id={`category-${category.category.replace(/[^a-zA-Z]/g, '')}`}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    {category.category}
                    <span className="text-sm font-normal text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{category.items.length} items</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.items.map((item) => (
                      <div key={item.id} className="card p-5 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-shadow bg-white border border-gray-100/50">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {/* Veg/Non-Veg icon placeholder based on fake logic */}
                                <div className={`w-4 h-4 border-2 flex items-center justify-center p-0.5 rounded-sm ${item.name.toLowerCase().includes('chicken') || item.name.toLowerCase().includes('mutton') ? 'border-red-600' : 'border-green-600'}`}>
                                  <div className={`w-2 h-2 rounded-full ${item.name.toLowerCase().includes('chicken') || item.name.toLowerCase().includes('mutton') ? 'bg-red-600' : 'bg-green-600'}`}></div>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                              </div>
                              <p className="font-bold text-gray-700 mt-1 mb-2">₹{item.price}</p>
                            </div>
                            {item.image_url && (
                              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-sm ml-4">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                          {item.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-snug">{item.description}</p>}
                        </div>

                        {/* Order Controls */}
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                          {!restaurant.is_open ? (
                            <span className="text-sm font-medium text-red-500 bg-red-50 px-3 py-1 rounded-lg">Restaurant Closed</span>
                          ) : !item.is_available ? (
                            <span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-lg">Out of stock</span>
                          ) : (
                            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors"
                              >
                                <HiMinus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-bold text-gray-800">
                                {cartQuantities[item.id] || 0}
                              </span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors"
                              >
                                <HiPlus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          
                          {(cartQuantities[item.id] || 0) > 0 && (
                            <button 
                              onClick={() => handleAddToCart(item.id, cartQuantities[item.id])}
                              className="btn-primary !px-4 !py-2 text-sm ml-auto animate-fade-in shadow-md hover:shadow-lg"
                            >
                              Add <span className="hidden sm:inline">to Cart</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
              </div>
            ) : (
              <div className="animate-slide-up space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">What customers say</h2>
                {reviews.length === 0 ? (
                  <div className="card p-20 text-center bg-gray-50 border-dashed border-2 border-gray-200 rounded-3xl">
                    <span className="text-4xl block mb-4">⭐</span>
                    <p className="text-gray-500">No reviews yet. Be the first to order and share your feedback!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.map(review => (
                      <div key={review.id} className="card p-6 bg-white border border-gray-100 hover:border-primary-100 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                              {review.user_name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 leading-tight">{review.user_name}</p>
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-yellow-400">
                            {[1, 2, 3, 4, 5].map(star => (
                              <HiStar key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm italic leading-relaxed">
                          "{review.comment || 'Perfect!'}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default RestaurantDetail;
