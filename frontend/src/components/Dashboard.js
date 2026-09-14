import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, metersAPI, routesAPI, usersAPI } from '../api/client';

export default function Dashboard() {
  const { user, logout, isManager } = useAuth();
  const [summary, setSummary] = useState(null);
  const [meters, setMeters] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  const manager = isManager ? isManager() : false;

  useEffect(() => {
    const loadData = async () => {
      try {
        const promises = [
          analyticsAPI.summary().then((r) => setSummary(r.data)).catch(() => {}),
          metersAPI.list().then((r) => setMeters(r.data)).catch(() => {}),
          routesAPI.list().then((r) => setRoutes(r.data)).catch(() => {}),
        ];

        // Only managers load technicians
        if (manager) {
          promises.push(
            usersAPI.listTechnicians()
              .then((r) => setTechnicians(r.data))
              .catch(() => {})
          );
        }

        await Promise.all(promises);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [manager]);

  // ============ DERIVED DATA ============
  const overdueMeters = meters.filter((m) => m.is_overdue);
  const highPriorityMeters = meters.filter((m) => m.priority <= 2 && !m.is_overdue);
  const todayRoutes = routes.filter((r) => {
    const routeDate = new Date(r.created_at);
    const today = new Date();
    return routeDate.toDateString() === today.toDateString();
  });

  // ============ MANAGER DASHBOARD ============
  if (manager) {
    return (
      <div className="dashboard">
        <header className="app-header">
          <h1>SmartRoute 👔 Manager</h1>
          <div className="header-right">
            <span>
              Hello <b>{user?.full_name || user?.username}</b>
              <span className="role-badge manager">MANAGER</span>
            </span>
            <button onClick={logout}>Logout</button>
          </div>
        </header>

        <nav className="app-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/meters">Meters ({meters.length})</Link>
          <Link to="/optimize">Optimize</Link>
          <Link to="/analytics">Analytics</Link>
        </nav>

        {/* Welcome */}
        <div className="welcome-banner manager">
          <h2>👔 Manager Dashboard</h2>
          <p>Team overview — monitor performance, assign meters, and optimize workflows.</p>
        </div>

        {/* Team Stats */}
        <h2 className="section-title">📊 Team Overview</h2>
        <div className="cards">
          <div className="card">
            <h3>Total Technicians</h3>
            <p className="metric">{technicians.length}</p>
          </div>
          <div className="card">
            <h3>Total Meters</h3>
            <p className="metric">{meters.length}</p>
          </div>
          <div className="card">
            <h3>Overdue Meters</h3>
            <p className="metric" style={{ color: '#c62828' }}>{overdueMeters.length}</p>
          </div>
          <div className="card">
            <h3>Total Routes</h3>
            <p className="metric">{routes.length}</p>
          </div>
          <div className="card highlight">
            <h3>Avg Improvement</h3>
            <p className="metric">
              {summary ? summary.avg_improvement_percent.toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Team Performance */}
        <div className="section-header">
          <h2 className="section-title">👥 Team Performance</h2>
          <Link to="/meters" className="section-link">View All Meters →</Link>
        </div>
        <div className="technician-grid">
          {technicians.length === 0 ? (
            <p className="empty-msg">
              No technicians registered yet. Ask your team to register.
            </p>
          ) : (
            technicians.map((tech) => {
              const techMeters = meters.filter((m) => m.assigned_to === tech.id);
              const techOverdue = techMeters.filter((m) => m.is_overdue);
              return (
                <div key={tech.id} className="tech-card">
                  <div className="tech-header">
                    <span className="tech-avatar">🔧</span>
                    <div>
                      <h4>{tech.full_name || tech.username}</h4>
                      <span className="tech-email">{tech.email}</span>
                    </div>
                  </div>
                  <div className="tech-stats">
                    <div className="tech-stat">
                      <span className="stat-value">{techMeters.length}</span>
                      <span className="stat-label">Meters</span>
                    </div>
                    <div className="tech-stat">
                      <span className="stat-value" style={{ color: '#c62828' }}>
                        {techOverdue.length}
                      </span>
                      <span className="stat-label">Overdue</span>
                    </div>
                    <div className="tech-stat">
                      <span className="stat-value">
                        {techMeters.length > 0 ? '✓' : '—'}
                      </span>
                      <span className="stat-label">Assigned</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2 className="section-title">⚡ Quick Actions</h2>
          <div className="action-grid">
            <Link to="/meters" className="action-card">
              <span className="icon">➕</span>
              <span className="label">Add / Import Meters</span>
            </Link>
            <Link to="/meters" className="action-card">
              <span className="icon">📋</span>
              <span className="label">Assign to Technicians</span>
            </Link>
            <Link to="/optimize" className="action-card">
              <span className="icon">🗺️</span>
              <span className="label">Optimize Team Routes</span>
            </Link>
            <Link to="/analytics" className="action-card">
              <span className="icon">📊</span>
              <span className="label">Team Analytics</span>
            </Link>
          </div>
        </div>

        {/* Recent Team Routes */}
        <div className="recent">
          <h2>📊 Recent Team Routes</h2>
          {routes.length === 0 ? (
            <p className="empty-msg">No routes yet. Go to Optimize to create one.</p>
          ) : (
            routes.slice(0, 5).map((r) => (
              <div key={r.id} className="route-row">
                <span>{r.name}</span>
                <span>{r.total_meters} meters</span>
                <span>{r.after_distance_km.toFixed(1)} km</span>
                <span className="saved">Saved {r.saved_distance_km.toFixed(1)} km</span>
                <span className="pct">{r.improvement_percent.toFixed(1)}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ============ TECHNICIAN DASHBOARD ============
  return (
    <div className="dashboard">
      <header className="app-header">
        <h1>SmartRoute 🔧 Technician</h1>
        <div className="header-right">
          <span>
            Hello <b>{user?.full_name || user?.username}</b>
            <span className="role-badge technician">TECHNICIAN</span>
          </span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <nav className="app-nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/meters">My Meters ({meters.length})</Link>
        <Link to="/optimize">My Route</Link>
        <Link to="/analytics">My Analytics</Link>
      </nav>

      {/* Welcome */}
      <div className="welcome-banner technician">
        <h2>🔧 Technician Dashboard</h2>
        <p>Your daily work overview — today's meters, priorities, and route.</p>
      </div>

      {/* Technician Stats */}
      <h2 className="section-title">📊 Today's Overview</h2>
      <div className="cards">
        <div className="card">
          <h3>My Meters</h3>
          <p className="metric">{meters.length}</p>
        </div>
        <div className="card">
          <h3>Overdue</h3>
          <p className="metric" style={{ color: '#c62828' }}>{overdueMeters.length}</p>
        </div>
        <div className="card">
          <h3>High Priority</h3>
          <p className="metric" style={{ color: '#ff6b00' }}>{highPriorityMeters.length}</p>
        </div>
        <div className="card">
          <h3>Routes Today</h3>
          <p className="metric">{todayRoutes.length}</p>
        </div>
        <div className="card highlight">
          <h3>Time Saved</h3>
          <p className="metric">
            {summary ? (summary.total_time_saved_min / 60).toFixed(1) : 0}h
          </p>
        </div>
      </div>

      {/* Urgent Meters */}
      {overdueMeters.length > 0 && (
        <div className="urgent-section">
          <h2 className="section-title" style={{ color: '#c62828' }}>
            🔴 Urgent — Overdue Meters ({overdueMeters.length})
          </h2>
          <div className="urgent-list">
            {overdueMeters.slice(0, 5).map((m) => (
              <div key={m.id} className="urgent-row">
                <span className="urgent-icon">🔴</span>
                <span className="urgent-id">{m.meter_id}</span>
                <span className="urgent-name">{m.name}</span>
                <span className="urgent-addr">{m.address || 'No address'}</span>
              </div>
            ))}
            {overdueMeters.length > 5 && (
              <div className="urgent-more">
                + {overdueMeters.length - 5} more overdue meters
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's Route */}
      <div className="section-header">
        <h2 className="section-title">🗺️ Today's Route</h2>
        <Link to="/optimize" className="section-link">Optimize Route →</Link>
      </div>
      <div className="today-route">
        {todayRoutes.length === 0 ? (
          <div className="empty-route">
            <p>No route optimized today yet.</p>
            <Link to="/optimize" className="btn-optimize-now">
              🚀 Optimize My Route Now
            </Link>
          </div>
        ) : (
          todayRoutes.map((r) => (
            <div key={r.id} className="today-route-card">
              <div className="route-info">
                <span className="route-name">{r.name}</span>
                <span className="route-details">
                  {r.total_meters} stops • {r.after_distance_km.toFixed(1)} km
                </span>
              </div>
              <div className="route-metrics">
                <div className="mini-metric">
                  <span className="mini-label">Distance</span>
                  <span className="mini-value">{r.after_distance_km.toFixed(1)} km</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-label">Time</span>
                  <span className="mini-value">
                    {(r.after_travel_time_min / 60).toFixed(1)}h
                  </span>
                </div>
                <div className="mini-metric">
                  <span className="mini-label">Saved</span>
                  <span className="mini-value" style={{ color: '#51cf66' }}>
                    {r.saved_distance_km.toFixed(1)} km
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* My Assigned Meters */}
      <div className="section-header">
        <h2 className="section-title">📋 My Assigned Meters</h2>
        <Link to="/meters" className="section-link">View All →</Link>
      </div>
      <div className="assigned-meters">
        {meters.length === 0 ? (
          <div className="empty-msg">
            No meters assigned yet. Ask your manager to assign meters.
          </div>
        ) : (
          meters.slice(0, 8).map((m) => (
            <div key={m.id} className="assigned-row">
              <span className="assigned-id">{m.meter_id}</span>
              <span className="assigned-name">{m.name}</span>
              <span className={`prio p${m.priority}`}>P{m.priority}</span>
              {m.is_overdue && <span className="overdue">OVERDUE</span>}
            </div>
          ))
        )}
        {meters.length > 8 && (
          <div className="assigned-more">
            <Link to="/meters">View all {meters.length} meters →</Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">⚡ Quick Actions</h2>
        <div className="action-grid">
          <Link to="/optimize" className="action-card">
            <span className="icon">🗺️</span>
            <span className="label">Optimize My Route</span>
          </Link>
          <Link to="/meters" className="action-card">
            <span className="icon">📋</span>
            <span className="label">View My Meters</span>
          </Link>
          <Link to="/analytics" className="action-card">
            <span className="icon">📊</span>
            <span className="label">My Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  );
}