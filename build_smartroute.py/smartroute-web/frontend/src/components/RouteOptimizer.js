import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { metersAPI, routesAPI } from '../api/client';
import RouteMap from './RouteMap';

export default function RouteOptimizer() {
  const [meters, setMeters] = useState([]);
  const [startLat, setStartLat] = useState('12.9716');
  const [startLon, setStartLon] = useState('77.5946');
  const [startLabel, setStartLabel] = useState('Office');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    metersAPI.list().then((r) => setMeters(r.data));
  }, []);

  const optimize = async () => {
    setLoading(true);
    try {
      const res = await routesAPI.optimize({
        start_lat: parseFloat(startLat),
        start_lon: parseFloat(startLon),
        start_label: startLabel,
      });
      setResult(res.data);
    } catch (err) {
      alert('Optimization failed: ' + ((err.response && err.response.data && err.response.data.detail) || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fmtTime = (min) => {
    if (min < 1) return (min * 60).toFixed(0) + 's';
    if (min < 60) return min.toFixed(1) + ' min';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h + 'h ' + m.toFixed(0) + 'm';
  };

  return (
    <div className="page">
      <nav className="app-nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/meters">Meters ({meters.length})</Link>
        <Link to="/optimize">Optimize</Link>
        <Link to="/analytics">Analytics</Link>
      </nav>

      <div className="optimizer-header">
        <div className="inputs">
          <label>Start Lat: <input value={startLat} onChange={(e) => setStartLat(e.target.value)} /></label>
          <label>Start Lon: <input value={startLon} onChange={(e) => setStartLon(e.target.value)} /></label>
          <label>Label: <input value={startLabel} onChange={(e) => setStartLabel(e.target.value)} /></label>
          <button onClick={optimize} disabled={loading || meters.length === 0}>
            {loading ? 'Optimizing...' : 'Optimize ' + meters.length + ' Meters'}
          </button>
        </div>
      </div>

      {result && (
        <div className="result-banner">
          <div className="metric-box before">
            <span className="label">BEFORE</span>
            <span className="value">{result.before_distance_km.toFixed(1)} km</span>
            <span className="time">{fmtTime(result.before_travel_time_min)}</span>
          </div>
          <div className="arrow">-&gt;</div>
          <div className="metric-box after">
            <span className="label">AFTER</span>
            <span className="value">{result.after_distance_km.toFixed(1)} km</span>
            <span className="time">{fmtTime(result.after_travel_time_min)}</span>
          </div>
          <div className="metric-box saved">
            <span className="label">SAVED</span>
            <span className="value">{result.saved_distance_km.toFixed(1)} km</span>
            <span className="time">{fmtTime(result.saved_travel_time_min)}</span>
            <span className="pct">{result.improvement_percent.toFixed(1)}%</span>
          </div>
          <div className="metric-box info">
            <span className="label">Speed</span>
            <span className="value">{result.avg_speed_kmph} km/h</span>
            <span className="area">{result.detected_area}</span>
          </div>
        </div>
      )}

      <div className="map-container">
        {result ? (
          <RouteMap
            startPoint={[result.start_lat, result.start_lon]}
            meters={meters}
            sequence={result.sequence}
          />
        ) : (
          <div className="map-placeholder">
            Click Optimize to see the route on the map
          </div>
        )}
      </div>
    </div>
  );
}
