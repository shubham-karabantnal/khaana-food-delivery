import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { HiOutlineLocationMarker, HiOutlineSearch, HiStar } from 'react-icons/hi';
import toast from 'react-hot-toast';

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (city) params.append('city', city);
      
      const res = await api.get(`/restaurants?${params.toString()}`);
      console.log('Fetched restaurants:', res.data);
      setRestaurants(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Failed to load restaurants');
      console.error('Restaurant fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [city]); // Re-fetch when city changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  return (
    <div className="section-container py-8 animate-fade-in">
      {/* Header & Filters */}
      <div className="mb-12 text-center md:text-left">
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 gradient-text">
          Explore Restaurants
        </h1>
        
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 max-w-3xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <HiOutlineSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input-field pl-11 !py-3 !rounded-2xl shadow-sm"
              placeholder="Search for restaurants or dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <HiOutlineLocationMarker className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="input-field pl-11 !py-3 !rounded-2xl shadow-sm appearance-none bg-white cursor-pointer"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">All Cities</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
              <option value="Delhi">Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Jaipur">Jaipur</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Mumbai">Mumbai</option>
            </select>
          </div>
          <button type="submit" className="btn-primary !rounded-2xl !py-3 px-8 shadow-md">
            Search
          </button>
        </form>
      </div>

      {/* Restaurant Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="card animate-pulse rounded-3xl overflow-hidden h-80">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <span className="text-6xl mb-4 block">🍽️</span>
          <h3 className="text-xl font-bold text-gray-800">No restaurants found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <Link 
              to={`/restaurants/${restaurant.id}`} 
              key={restaurant.id}
              className="group card overflow-hidden rounded-3xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img 
                  src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'} 
                  alt={restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {!restaurant.is_open && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase">
                      Currently Closed
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-sm font-bold">
                    <span>{parseFloat(restaurant.avg_rating).toFixed(1)}</span>
                    <HiStar className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <HiOutlineLocationMarker className="w-4 h-4 mr-1 text-primary-400" />
                  <span className="line-clamp-1">{restaurant.address}, {restaurant.city}</span>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full font-medium">
                    {restaurant.total_reviews} Reviews
                  </span>
                  <span className="text-sm font-semibold text-primary-600 group-hover:translate-x-1 transition-transform inline-block">
                    View Menu →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Restaurants;
