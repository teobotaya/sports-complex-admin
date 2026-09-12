import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps extends RouteProps {
  adminOnly?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ adminOnly, ...rest }) => {
  const { usuario } = useAuth();

  if (!usuario) return <Redirect to="/login" />;
  if (adminOnly && usuario.rol !== 'administrador') return <Redirect to="/" />;

  return <Route {...rest} />;
};

export default PrivateRoute;
