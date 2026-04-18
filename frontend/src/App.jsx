import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Phase 2 pages:
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Phase 3 pages:
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerOrders from './pages/owner/OwnerOrders';
import AdminDashboard from './pages/admin/AdminDashboard';

// Phase 4 pages:
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

console.log('--- App.jsx executing ---');

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        {/* Phase 2: Auth routes */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-otp" element={<VerifyOTP />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        {/* Phase 3: Restaurant routes */}
        <Route path="restaurants" element={<Restaurants />} />
        <Route path="restaurants/:id" element={<RestaurantDetail />} />
        <Route path="owner/dashboard" element={<OwnerDashboard />} />
        <Route path="owner/orders" element={<OwnerOrders />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />

        {/* Phase 4: Cart & Orders */}
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
