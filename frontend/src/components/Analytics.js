import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, routesAPI } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    analyticsAPI.summary().then((r) => setSummary(r.data));
    routesAPI.list().then((r) => setRoutes(r.data));
  }, []);

  const chartData = routes.slice(0, 10).reverse().map((r) => ({
    name: '#' + r.id,
    before: r.before_distance_km,
    after: r.after_distance_km,
  }));

  return (
    <div className="page">
      <nav className="app-nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/meters">Meters</Link>
        <Link to="/optimize">Optimize</Link>
        <Link to="/analytics">Analytics</Link>
      </nav>

      <h1>Analytics Dashboard</h1>

      {summary && (
        <div className="cards">
          <div className="card"><h3>Routes</h3><p className="metric">{summary.total_routes}</p></div>
          <div className="card"><h3>Meters Served</h3><p className="metric">{summary.total_meters_served}</p></div>
          <div className="card"><h3>Total Distance</h3><p className="metric">{summary.total_distance_km.toFixed(1)} km</p></div>
          <div className="card highlight"><h3>Time Saved</h3><p className="metric">{(summary.total_time_saved_min/60).toFixed(1)} hrs</p></div>
          <div className="card highlight"><h3>Avg Improvement</h3><p className="metric">{summary.avg_improvement_percent.toFixed(1)}%</p></div>
        </div>
      )}

      <h2>Before vs After (Last 10 Routes)</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="before" fill="#ff6b6b" name="Before (km)" />
            <Bar dataKey="after" fill="#51cf66" name="After (km)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
