import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCurrencyRupee, HiOutlineClipboardList, HiOutlineStar, HiOutlineTrendingUp } from 'react-icons/hi';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        toast.error('Failed to load admin statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="section-container py-20 text-center animate-pulse">Loading Admin Stats...</div>;
  if (!stats) return <div className="section-container py-20 text-center">Unauthorized or Error</div>;

  return (
    <div className="section-container py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-500">Overview of system performance and revenue</p>
        </div>
        <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-xl border border-primary-100 font-bold flex items-center gap-2">
          <HiOutlineCurrencyRupee className="w-5 h-5" />
          Platform Live
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          icon={<HiOutlineCurrencyRupee />} 
          label="Total Revenue" 
          value={`₹${stats.system_summary.total_revenue.toLocaleString()}`} 
          color="bg-green-500" 
        />
        <StatCard 
          icon={<HiOutlineClipboardList />} 
          label="Active Orders" 
          value={stats.system_summary.active_orders_count} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={<HiOutlineTrendingUp />} 
          label="Total Orders" 
          value={stats.revenue_by_restaurant.reduce((s, r) => s + parseInt(r.total_orders), 0)} 
          color="bg-purple-500" 
        />
        <StatCard 
          icon={<HiOutlineStar />} 
          label="Avg Rating" 
          value="4.8" 
          color="bg-yellow-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue by Restaurant */}
        <div className="card p-8">
          <h3 className="text-xl font-bold mb-6 text-gray-900">Revenue by Restaurant</h3>
          <div className="space-y-4">
            {stats.revenue_by_restaurant.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-bold text-gray-900">{r.restaurant}</p>
                  <p className="text-xs text-gray-500">{r.total_orders} orders</p>
                </div>
                <p className="font-bold text-primary-600">₹{parseFloat(r.total_revenue).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Items */}
        <div className="card p-8">
          <h3 className="text-xl font-bold mb-6 text-gray-900">Popular Delicacies</h3>
          <div className="space-y-4">
            {stats.popular_items.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-bold text-gray-900">{item.item}</p>
                  <p className="text-xs text-gray-500">{item.restaurant}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent-600">{item.total_ordered}</p>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card p-6 flex items-center gap-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default AdminDashboard;
