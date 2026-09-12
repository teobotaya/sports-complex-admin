import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

const Login: React.FC = () => {
  const { usuario, login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (usuario) return <Redirect to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al iniciar sesión.');
    }
  };

  return (
    <div className="login-page">
      <aside className="login-visual" aria-hidden="true">
        <div className="login-pitch">
          <span className="login-pitch-box is-left" />
          <span className="login-pitch-box is-right" />
        </div>
        <div className="login-ball">
          <span className="login-ball-pentagon is-center" />
          <span className="login-ball-pentagon is-p1" />
          <span className="login-ball-pentagon is-p2" />
          <span className="login-ball-pentagon is-p3" />
          <span className="login-ball-pentagon is-p4" />
          <span className="login-ball-pentagon is-p5" />
        </div>
        <div className="login-visual-content">
          <span className="login-visual-mark">SC</span>
          <h2>Gestión integral del complejo deportivo</h2>
          <p>Canchas, reservas, clientes, pagos y torneos en un solo panel de administración.</p>
          <ul className="login-visual-list">
            <li>Disponibilidad de canchas en tiempo real</li>
            <li>Reservas, cancelaciones y pagos trazables</li>
            <li>Torneos, equipos y partidos organizados</li>
          </ul>
        </div>
      </aside>

      <main className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-brand">
            <span className="sidebar-brand-mark">SC</span>
            <span>Sports Complex Admin</span>
          </div>

          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-subtitle">Ingresá con tu usuario del complejo para continuar.</p>

          {error && <div className="login-error">{error}</div>}

          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-sc-primary text-white w-100" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="login-footnote">Acceso exclusivo para personal autorizado.</p>
        </form>
      </main>
    </div>
  );
};

export default Login;
