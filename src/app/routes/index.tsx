// Rutas de navegación del sistema de gestión integral del complejo deportivo.
// Se usa react-router-dom v5 (Switch/Route) para mantener consistencia con el
// resto del prototipo.

import React from 'react';
import { Switch, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Reservas from '../pages/Reservas';
import Agenda from '../pages/Agenda';
import NuevaReserva from '../pages/NuevaReserva';
import Clientes from '../pages/Clientes';
import ClienteDetalle from '../pages/ClienteDetalle';
import Canchas from '../pages/Canchas';
import Pagos from '../pages/Pagos';
import Cancelaciones from '../pages/Cancelaciones';
import Torneos from '../pages/Torneos';
import TorneoDetalle from '../pages/TorneoDetalle';
import Equipos from '../pages/Equipos';
import Partidos from '../pages/Partidos';
import Notificaciones from '../pages/Notificaciones';
import Reportes from '../pages/Reportes';
import Estadisticas from '../pages/Estadisticas';
import Usuarios from '../pages/Usuarios';

const AppRoutes: React.FC = () => {
  return (
    <Switch>
      <Route path="/login" exact component={Login} />
      <PrivateRoute path="/" exact component={Dashboard} />
      <PrivateRoute path="/reservas" exact component={Reservas} />
      <PrivateRoute path="/agenda" exact component={Agenda} />
      <PrivateRoute path="/nueva-reserva" exact component={NuevaReserva} />
      <PrivateRoute path="/clientes" exact component={Clientes} />
      <PrivateRoute path="/clientes/:id" component={ClienteDetalle} />
      <PrivateRoute path="/canchas" component={Canchas} />
      <PrivateRoute path="/pagos" component={Pagos} />
      <PrivateRoute path="/cancelaciones" component={Cancelaciones} />
      <PrivateRoute path="/torneos" exact component={Torneos} />
      <PrivateRoute path="/torneos/:id" component={TorneoDetalle} />
      <PrivateRoute path="/equipos" component={Equipos} />
      <PrivateRoute path="/partidos" component={Partidos} />
      <PrivateRoute path="/notificaciones" component={Notificaciones} />
      <PrivateRoute path="/reportes" adminOnly component={Reportes} />
      <PrivateRoute path="/estadisticas" adminOnly component={Estadisticas} />
      <PrivateRoute path="/usuarios" adminOnly component={Usuarios} />
    </Switch>
  );
};

export default AppRoutes;
