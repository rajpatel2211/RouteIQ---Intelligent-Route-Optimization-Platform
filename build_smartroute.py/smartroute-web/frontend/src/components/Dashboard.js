import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, metersAPI, routesAPI } from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [meters, setMeters] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    analyticsAPI.summary().then((r) => setSummary(r.data));
    metersAPI.list().then((r) => setMeters(r.data));
    routesAPI.list().then((r) => setRoutes(r.data));
  }, []);

  return (
    <div className="dashboard">
      <header className="app-header">
        <h1>SmartRoute</h1>
        <div className="header-right">
          <span>Hello {user ? (user.full_name || user.username) : ''}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <nav className="app-nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/meters">Meters ({meters.length})</Link>
        <Link to="/optimize">Optimize</Link>
        <Link to="/analytics">Analytics</Link>
      </nav>

      <div className="cards">
        <div className="card">
          <h3>Total Routes</h3>
          <p className="metric">{summary ? summary.total_routes : 0}</p>
        </div>
        <div className="card">
          <h3>Meters Served</h3>
          <p className="metric">{summary ? summary.total_meters_served : 0}</p>
        </div>
        <div className="card">
          <h3>Total Distance</h3>
          <p className="metric">{summary ? summary.total_distance_km.toFixed(1) : 0} km</p>
        </div>
        <div className="card">
          <h3>Time Saved</h3>
          <p className="metric">{summary ? (summary.total_time_saved_min/60).toFixed(1) : 0} hrs</p>
        </div>
        <div className="card highlight">
          <h3>Avg Improvement</h3>
          <p className="metric">{summary ? summary.avg_improvement_percent.toFixed(1) : 0}%</p>
        </div>
      </div>

      <div className="recent">
        <h2>Recent Routes</h2>
        {routes.slice(0, 5).map((r) => (
          <div key={r.id} className="route-row">
            <span>{r.name}</span>
            <span>{r.total_meters} meters</span>
            <span>{r.after_distance_km.toFixed(1)} km</span>
            <span className="saved">Saved {r.saved_distance_km.toFixed(1)} km</span>
            <span className="pct">{r.improvement_percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
