import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import CustomerMarketplace from './pages/CustomerMarketplace';
import CustomerOrders from './pages/CustomerOrders';
import OrderTracking from './pages/OrderTracking';
import DeliveryDashboard from './pages/DeliveryDashboard';

const PrivateRoute: React.FC<{ children: React.ReactNode; roles: string[] }> = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/" />; // Or unauthorized page
  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Role Redirect */}
      <Route path="/" element={
        user ? (
          user.role === 'FARMER' ? <Navigate to="/farmer" /> :
            user.role === 'CUSTOMER' ? <Navigate to="/market" /> :
              user.role === 'DELIVERY_PARTNER' ? <Navigate to="/delivery" /> :
                <Navigate to="/login" />
        ) : <Navigate to="/login" />
      } />

      <Route path="/farmer" element={
        <PrivateRoute roles={['FARMER']}>
          <FarmerDashboard />
        </PrivateRoute>
      } />

      <Route path="/market" element={
        <PrivateRoute roles={['CUSTOMER']}>
          <CustomerMarketplace />
        </PrivateRoute>
      } />

      <Route path="/orders" element={
        <PrivateRoute roles={['CUSTOMER']}>
          <CustomerOrders />
        </PrivateRoute>
      } />

      <Route path="/track/:orderId" element={
        <PrivateRoute roles={['CUSTOMER']}>
          <OrderTracking />
        </PrivateRoute>
      } />

      <Route path="/delivery" element={
        <PrivateRoute roles={['DELIVERY_PARTNER']}>
          <DeliveryDashboard />
        </PrivateRoute>
      } />

    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
