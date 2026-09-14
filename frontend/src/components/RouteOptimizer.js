import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { metersAPI, routesAPI } from '../api/client';
import RouteMap from './RouteMap';

// City configuration with multiple accepted prefixes
const CITIES = {
  'Bengaluru': { 
    lat: 12.9716, lon: 77.5946, baseSpeed: 22, traffic: 'Heavy', 
    prefixes: ['BEN', 'BLR', 'BANG', 'BENGALURU'] 
  },
  'Mumbai': { 
    lat: 19.0760, lon: 72.8777, baseSpeed: 20, traffic: 'Very Heavy', 
    prefixes: ['MUM', 'BOM', 'MUMBAI'] 
  },
  'Delhi': { 
    lat: 28.6139, lon: 77.2090, baseSpeed: 25, traffic: 'Heavy', 
    prefixes: ['DEL', 'DL', 'NDL', 'DELHI'] 
  },
  'Chennai': { 
    lat: 13.0827, lon: 80.2707, baseSpeed: 28, traffic: 'Moderate', 
    prefixes: ['CHE', 'MAA', 'MADRAS', 'CHENNAI'] 
  },
  'Hyderabad': { 
    lat: 17.3850, lon: 78.4867, baseSpeed: 30, traffic: 'Moderate', 
    prefixes: ['HYD', 'HYDERABAD'] 
  },
};

export default function RouteOptimizer() {
  const [allMeters, setAllMeters] = useState([]);
  const [city, setCity] = useState('Bengaluru');
  const [startLat, setStartLat] = useState(CITIES['Bengaluru'].lat.toString());
  const [startLon, setStartLon] = useState(CITIES['Bengaluru'].lon.toString());
  const [startLabel, setStartLabel] = useState('Bengaluru Office');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    metersAPI.list().then((r) => setAllMeters(r.data)).catch(() => {});
  }, []);

  // Smart city matching — checks prefix OR city field
  const cityConfig = CITIES[city];
  const meters = allMeters.filter((m) => {
    if (!m.meter_id) return false;
    const prefix = m.meter_id.split('-')[0].toUpperCase();
    const prefixMatch = cityConfig.prefixes.some((p) => 
      prefix === p.toUpperCase() || prefix.startsWith(p.toUpperCase())
    );
    const cityFieldMatch = m.city && m.city.toLowerCase() === city.toLowerCase();
    return prefixMatch || cityFieldMatch;
  });

  const handleCityChange = (newCity) => {
    setCity(newCity);
    setStartLat(CITIES[newCity].lat.toString());
    setStartLon(CITIES[newCity].lon.toString());
    setStartLabel(`${newCity} Office`);
    setResult(null);
  };

  const optimize = async () => {
    if (meters.length === 0) {
      alert(`No ${city} meters found. Go to Meters page and add meters for ${city}.`);
      return;
    }

    setLoading(true);
    try {
      const meterIds = meters.map((m) => m.meter_id);
      const res = await routesAPI.optimize({
        start_lat: parseFloat(startLat),
        start_lon: parseFloat(startLon),
        start_label: startLabel,
        meter_ids: meterIds,
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

  const getAreaDescription = (area) => {
    const map = {
      'city_center': '🏙️ City Center (25 km/h)',
      'urban': '🏘️ Urban Area (32 km/h)',
      'suburban': '🏡 Suburban (40 km/h)',
      'mixed': '🌳 Mixed Area (46 km/h)',
      'highway': '🛣️ Highway (60 km/h)',
    };
    return map[area] || area;
  };

  return (
    <div className="page">
      <nav className="app-nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/meters">Meters ({allMeters.length})</Link>
        <Link to="/optimize">Optimize</Link>
        <Link to="/analytics">Analytics</Link>
      </nav>

      <div className="optimizer-header">
        <h2>🗺️ Route Optimizer</h2>

        <div className="city-selector">
          <label>
            <b>Select City:</b>
            <select value={city} onChange={(e) => handleCityChange(e.target.value)}>
              {Object.keys(CITIES).map((c) => {
                const count = allMeters.filter((m) => {
                  if (!m.meter_id) return false;
                  const p = m.meter_id.split('-')[0].toUpperCase();
                  const prefixMatch = CITIES[c].prefixes.some((x) => 
                    p === x.toUpperCase() || p.startsWith(x.toUpperCase())
                  );
                  const cityMatch = m.city && m.city.toLowerCase() === c.toLowerCase();
                  return prefixMatch || cityMatch;
                }).length;
                return (
                  <option key={c} value={c}>
                    {c} — {count} meters ({CITIES[c].traffic} traffic)
                  </option>
                );
              })}
            </select>
          </label>
          <span className="city-hint">
            📍 {city}: {meters.length} meters | Base speed: {cityConfig.baseSpeed} km/h
          </span>
        </div>

        {meters.length === 0 && (
          <div className="warning-box">
            ⚠️ <b>No meters found for {city}.</b> Go to{' '}
            <Link to="/meters" style={{ color: '#667eea', fontWeight: 600 }}>
              Meters page
            </Link>{' '}
            and add meters for <b>{city}</b>.
          </div>
        )}

        <div className="inputs">
          <label>Start Lat: <input value={startLat} onChange={(e) => setStartLat(e.target.value)} /></label>
          <label>Start Lon: <input value={startLon} onChange={(e) => setStartLon(e.target.value)} /></label>
          <label>Label: <input value={startLabel} onChange={(e) => setStartLabel(e.target.value)} /></label>
          <button onClick={optimize} disabled={loading || meters.length === 0}>
            {loading ? 'Optimizing...' : `Optimize ${meters.length} ${city} Meters`}
          </button>
        </div>
      </div>

      {result && (
        <>
          <div className="result-banner">
            <div className="metric-box before">
              <span className="label">BEFORE</span>
              <span className="value">{result.before_distance_km.toFixed(1)} km</span>
              <span className="time">{fmtTime(result.before_travel_time_min)}</span>
            </div>
            <div className="arrow">→</div>
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
          </div>

          <div className="speed-panel">
            <div className="speed-card city">
              <span className="icon">🏙️</span>
              <span className="label">City</span>
              <span className="value">{city}</span>
              <span className="sub">{cityConfig.traffic} traffic</span>
            </div>
            <div className="speed-card area">
              <span className="icon">📊</span>
              <span className="label">Area Detected</span>
              <span className="value">{getAreaDescription(result.detected_area)}</span>
              <span className="sub">based on meter density</span>
            </div>
            <div className="speed-card speed">
              <span className="icon">🚗</span>
              <span className="label">Avg Speed</span>
              <span className="value">{result.avg_speed_kmph} km/h</span>
              <span className="sub">dynamic calculation</span>
            </div>
            <div className="speed-card time">
              <span className="icon">⏱️</span>
              <span className="label">Est. Travel Time</span>
              <span className="value">{fmtTime(result.after_travel_time_min)}</span>
              <span className="sub">for optimized route</span>
            </div>
          </div>
        </>
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
            {meters.length === 0
              ? `No meters for ${city}. Generate some on the Meters page.`
              : `Click "Optimize ${meters.length} ${city} Meters" to see the route`}
          </div>
        )}
      </div>
    </div>
  );
}