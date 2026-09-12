import React, { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import MainLayout from './app/layouts/MainLayout';
import AppRoutes from './app/routes';
import { AuthProvider } from './app/context/AuthContext';
import { applyPageMeta } from './app/components/pageMeta';

const Shell: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    applyPageMeta(location.pathname);
  }, [location.pathname]);

  if (location.pathname === '/login') return <AppRoutes />;
  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </Router>
  );
};

export default App;
