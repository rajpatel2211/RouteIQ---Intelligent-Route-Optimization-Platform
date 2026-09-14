import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { metersAPI, usersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

// ==================== HELPER ====================
const round = (num, decimals) =>
  Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

// ==================== CITY BOUNDS (Land-Only) ====================
const CITY_BOUNDS = {
  Bengaluru: { lat: [12.85, 13.10], lon: [77.48, 77.72], base: { lat: 12.9716, lon: 77.5946 } },
  Mumbai: { lat: [18.92, 19.25], lon: [72.79, 72.96], base: { lat: 19.0760, lon: 72.8777 } },
  Delhi: { lat: [28.45, 28.75], lon: [76.90, 77.30], base: { lat: 28.6139, lon: 77.2090 } },
  Chennai: { lat: [12.95, 13.18], lon: [80.10, 80.26], base: { lat: 13.0500, lon: 80.2000 } },
  Hyderabad: { lat: [17.25, 17.52], lon: [78.32, 78.62], base: { lat: 17.3850, lon: 78.4867 } },
};

// ==================== OCEAN EXCLUSIONS ====================
const OCEAN_EXCLUSIONS = {
  Chennai: [
    { lat: [13.00, 13.20], lon: [80.29, 80.50] },
    { lat: [12.90, 13.20], lon: [80.35, 80.50] },
  ],
  Mumbai: [
    { lat: [18.90, 19.30], lon: [72.97, 73.15] },
    { lat: [18.90, 19.20], lon: [72.75, 72.79] },
  ],
};

// ==================== COMPONENT ====================
export default function MeterList() {
  const { isManager } = useAuth();
  const manager = isManager();

  const [meters, setMeters] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [assignTo, setAssignTo] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');

  const [form, setForm] = useState({
    meter_id: '', name: '', latitude: '', longitude: '',
    priority: 3, is_overdue: false, address: '', city: '', area: ''
  });
  const [genCity, setGenCity] = useState('Bengaluru');
  const [genCount, setGenCount] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // ==================== LOAD DATA ====================
  const load = async () => {
    try {
      const mRes = await metersAPI.list();
      setMeters(mRes.data);

      if (manager) {
        try {
          const tRes = await usersAPI.listTechnicians();
          setTechnicians(tRes.data);
        } catch (err) {
          console.error('Could not load technicians:', err);
        }
      }
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  useEffect(() => { load(); }, []);

  // ==================== MANUAL ADD ====================
  const submit = async (e) => {
    e.preventDefault();
    try {
      await metersAPI.create({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        priority: parseInt(form.priority)
      });
      setForm({
        meter_id: '', name: '', latitude: '', longitude: '',
        priority: 3, is_overdue: false, address: '', city: '', area: ''
      });
      load();
    } catch (err) {
      alert('Failed to add meter: ' + (err.response?.data?.detail || err.message));
    }
  };

  // ==================== DELETE ====================
  const del = async (id) => {
    if (window.confirm('Delete this meter?')) {
      await metersAPI.delete(id);
      setSelectedIds([]);
      load();
    }
  };

  const clearAll = async () => {
    if (!window.confirm(`Delete ALL ${meters.length} meters?`)) return;
    for (const m of meters) {
      await metersAPI.delete(m.id);
    }
    setSelectedIds([]);
    load();
  };

  // ==================== SELECTION ====================
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === meters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(meters.map((m) => m.id));
    }
  };

  // ==================== ASSIGNMENT ====================
  const handleAssign = async () => {
    if (selectedIds.length === 0) {
      setAssignMsg('❌ Select at least one meter first');
      setTimeout(() => setAssignMsg(''), 3000);
      return;
    }
    if (!assignTo) {
      setAssignMsg('❌ Select a technician');
      setTimeout(() => setAssignMsg(''), 3000);
      return;
    }

    setAssigning(true);
    setAssignMsg('');
    try {
      const res = await metersAPI.bulkAssign(selectedIds, parseInt(assignTo));
      setAssignMsg(`✅ ${res.data.message}`);
      setSelectedIds([]);
      setAssignTo('');
      load();
      setTimeout(() => setAssignMsg(''), 4000);
    } catch (err) {
      setAssignMsg(`❌ ${err.response?.data?.detail || err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (selectedIds.length === 0) {
      setAssignMsg('❌ Select at least one meter first');
      setTimeout(() => setAssignMsg(''), 3000);
      return;
    }

    setAssigning(true);
    setAssignMsg('');
    try {
      const res = await metersAPI.unassign(selectedIds);
      setAssignMsg(`✅ ${res.data.message}`);
      setSelectedIds([]);
      load();
      setTimeout(() => setAssignMsg(''), 4000);
    } catch (err) {
      setAssignMsg(`❌ ${err.response?.data?.detail || err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  // ==================== LAND CHECK ====================
  const isOnWater = (city, lat, lon) => {
    if (city === 'Chennai') {
      let coastLon;
      if (lat < 12.95) coastLon = 80.24;
      else if (lat < 13.00) coastLon = 80.26;
      else if (lat < 13.05) coastLon = 80.28;
      else if (lat < 13.10) coastLon = 80.29;
      else if (lat < 13.15) coastLon = 80.30;
      else coastLon = 80.31;
      if (lon > coastLon) return true;
    }
    if (city === 'Mumbai') {
      let westCoastLon;
      if (lat < 19.00) westCoastLon = 72.80;
      else if (lat < 19.15) westCoastLon = 72.82;
      else westCoastLon = 72.84;
      if (lon < westCoastLon) return true;
      if (lat > 18.95 && lat < 19.25 && lon > 72.96) return true;
    }
    const zones = OCEAN_EXCLUSIONS[city] || [];
    for (const zone of zones) {
      if (lat >= zone.lat[0] && lat <= zone.lat[1] &&
          lon >= zone.lon[0] && lon <= zone.lon[1]) {
        return true;
      }
    }
    return false;
  };

  // ==================== BULK GENERATE ====================
  const generateDemo = async () => {
    const config = CITY_BOUNDS[genCity];
    const count = parseInt(genCount) || 50;
    const radiusLat = (config.lat[1] - config.lat[0]) / 2;
    const radiusLon = (config.lon[1] - config.lon[0]) / 2;
    const centerLat = config.base.lat;
    const centerLon = config.base.lon;

    const demoMeters = [];
    let attempts = 0;
    const maxAttempts = count * 20;

    while (demoMeters.length < count && attempts < maxAttempts) {
      attempts++;
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.sqrt(Math.random());
      const lat = centerLat + r * radiusLat * Math.cos(angle);
      const lon = centerLon + r * radiusLon * Math.sin(angle);
      if (isOnWater(genCity, lat, lon)) continue;

      const i = demoMeters.length + 1;
      demoMeters.push({
        meter_id: `${genCity.substring(0, 3).toUpperCase()}-${String(i).padStart(4, '0')}`,
        name: `${genCity} Meter ${String(i).padStart(4, '0')}`,
        latitude: round(lat, 6),
        longitude: round(lon, 6),
        priority: Math.ceil(Math.random() * 5),
        is_overdue: Math.random() < 0.15,
        address: `${genCity} zone ${(i % 20) + 1}`,
        city: genCity,
        area: `Zone ${(i % 20) + 1}`
      });
    }

    await metersAPI.bulk(demoMeters);
    load();
    alert(`✅ Generated ${demoMeters.length} meters for ${genCity}`);
  };

  // ==================== CSV UPLOAD ====================
  const parseCSV = (text) => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) throw new Error('CSV is empty');

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const required = ['meter_id', 'name', 'latitude', 'longitude'];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length > 0) {
      throw new Error(`Missing required columns: ${missing.join(', ')}`);
    }

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ? values[idx].trim() : '';
      });
      if (!row.meter_id || !row.latitude || !row.longitude) continue;

      parsed.push({
        meter_id: row.meter_id,
        name: row.name || row.meter_id,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        priority: row.priority ? parseInt(row.priority) : 3,
        is_overdue: row.is_overdue
          ? ['true', '1', 'yes', 'y'].includes(row.is_overdue.toLowerCase())
          : false,
        address: row.address || '',
        city: row.city || '',
        area: row.area || ''
      });
    }
    return parsed;
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else current += char;
    }
    result.push(current);
    return result;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg('');

    try {
      const text = await file.text();
      const parsedMeters = parseCSV(text);
      if (parsedMeters.length === 0) throw new Error('No valid meters found in CSV');

      setUploadMsg(`📄 Found ${parsedMeters.length} meters. Uploading...`);

      const chunkSize = 100;
      let uploaded = 0;
      for (let i = 0; i < parsedMeters.length; i += chunkSize) {
        const chunk = parsedMeters.slice(i, i + chunkSize);
        await metersAPI.bulk(chunk);
        uploaded += chunk.length;
        setUploadMsg(`📄 Uploaded ${uploaded} / ${parsedMeters.length} meters...`);
      }

      setUploadMsg(`✅ Successfully uploaded ${uploaded} meters!`);
      load();
      setTimeout(() => setUploadMsg(''), 4000);
    } catch (err) {
      setUploadMsg(`❌ Error: ${err.message}`);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const downloadSampleCSV = () => {
    const sample = `meter_id,name,latitude,longitude,priority,is_overdue,address,city,area
BLR-1001,Bengaluru Meter 1001,12.9716,77.5946,3,false,123 MG Road Bengaluru,Bengaluru,MG Road
BLR-1002,Bengaluru Meter 1002,12.9350,77.6240,2,false,456 Koramangala Bengaluru,Bengaluru,Koramangala
MUM-2001,Mumbai Meter 2001,19.0760,72.8777,3,false,Marine Drive Mumbai,Mumbai,Marine Drive
DEL-3001,Delhi Meter 3001,28.6139,77.2090,3,false,Connaught Place Delhi,Delhi,Connaught Place`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_meters.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ==================== HELPERS ====================
  const getTechName = (techId) => {
    if (!techId) return null;
    const tech = technicians.find((t) => t.id === techId);
    return tech ? (tech.full_name || tech.username) : `User #${techId}`;
  };

  const metersByCity = meters.reduce((acc, m) => {
    const prefix = m.meter_id ? m.meter_id.split('-')[0] : 'OTHER';
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(m);
    return acc;
  }, {});

  // ==================== RENDER ====================
  return (
    <div className="page">
      <nav className="app-nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/meters">Meters</Link>
        <Link to="/optimize">Optimize</Link>
        <Link to="/analytics">Analytics</Link>
      </nav>

      <div className="two-col">
        {/* ============ LEFT: INPUT PANEL ============ */}
        <div className="form-panel">

          {/* Role Notice */}
          {!manager ? (
            <div className="role-notice technician">
              <h3>🔧 Technician View</h3>
              <p>You can add meters manually. New meters are auto-assigned to you.</p>
              <p className="role-notice-hint">
                For bulk import and CSV upload, contact your manager.
              </p>
            </div>
          ) : (
            <div className="role-notice manager">
              <h3>👔 Manager View</h3>
              <p>Full access — add meters, upload CSVs, assign to technicians.</p>
            </div>
          )}

          {/* Assignment Panel - MANAGER ONLY */}
          {manager && technicians.length > 0 && (
            <div className="assign-panel">
              <h3>👥 Assign Meters to Technicians</h3>

              <div className="assign-info">
                <b>{selectedIds.length}</b>{' '}
                meter{selectedIds.length !== 1 ? 's' : ''} selected
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    className="clear-selection"
                    onClick={() => setSelectedIds([])}
                  >
                    Clear
                  </button>
                )}
              </div>

              <label className="assign-label">
                Assign to:
                <select
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                >
                  <option value="">-- Choose Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name || t.username} ({t.username})
                    </option>
                  ))}
                </select>
              </label>

              <div className="assign-buttons">
                <button
                  type="button"
                  className="btn-assign"
                  onClick={handleAssign}
                  disabled={assigning || selectedIds.length === 0 || !assignTo}
                >
                  {assigning ? '⏳ Assigning...' : '✅ Assign'}
                </button>
                <button
                  type="button"
                  className="btn-unassign"
                  onClick={handleUnassign}
                  disabled={assigning || selectedIds.length === 0}
                >
                  ❌ Unassign
                </button>
              </div>

              {assignMsg && (
                <div className={`assign-msg ${assignMsg.includes('❌') ? 'error' : 'success'}`}>
                  {assignMsg}
                </div>
              )}
            </div>
          )}

          {manager && technicians.length === 0 && (
            <div className="warning-box">
              ⚠️ <b>No technicians registered yet.</b>
              <p style={{ marginTop: '6px', fontSize: '12.5px' }}>
                Ask your team to register with role <b>Technician</b> at <code>/register</code>
              </p>
            </div>
          )}

          {/* Add Meter - MANAGER ONLY */}
          {manager && (
            <>
              <h2>➕ Add Meter</h2>
              <form onSubmit={submit}>
                <input
                  placeholder="Meter ID (e.g., BLR-1001)"
                  value={form.meter_id}
                  onChange={(e) => setForm({ ...form, meter_id: e.target.value })}
                  required
                />
                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  type="number" step="any" placeholder="Latitude"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  required
                />
                <input
                  type="number" step="any" placeholder="Longitude"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  required
                />
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="1">Priority 1 (Highest)</option>
                  <option value="2">Priority 2</option>
                  <option value="3">Priority 3</option>
                  <option value="4">Priority 4</option>
                  <option value="5">Priority 5 (Lowest)</option>
                </select>
                <input
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_overdue}
                    onChange={(e) => setForm({ ...form, is_overdue: e.target.checked })}
                  />
                  Overdue
                </label>
                <button type="submit">Add Meter</button>
              </form>
            </>
          )}

          {/* MANAGER ONLY: CSV Upload & Bulk Generate */}
          {manager && (
            <>
              <hr />
              <h3>📁 Upload CSV File</h3>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                Upload a CSV with columns: meter_id, name, latitude, longitude, priority, is_overdue, address, city, area
              </p>
              <div className="upload-box">
                <input
                  type="file" accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  id="csv-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="csv-upload" className="upload-btn">
                  {uploading ? '⏳ Uploading...' : '📤 Choose CSV File'}
                </label>
                <button type="button" onClick={downloadSampleCSV} className="secondary">
                  📥 Download Sample CSV
                </button>
              </div>
              {uploadMsg && (
                <div className={`upload-msg ${uploadMsg.includes('❌') ? 'error' : 'success'}`}>
                  {uploadMsg}
                </div>
              )}

              <hr />
              <h3>🚀 Bulk Generate (Land-Only)</h3>
              <div className="bulk-form">
                <label>
                  City:
                  <select value={genCity} onChange={(e) => setGenCity(e.target.value)}>
                    {Object.keys(CITY_BOUNDS).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Count:
                  <input
                    type="number" min="1" max="1000"
                    value={genCount}
                    onChange={(e) => setGenCount(e.target.value)}
                  />
                </label>
                <button type="button" onClick={generateDemo} className="secondary">
                  Generate {genCount} Demo Meters in {genCity}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ============ RIGHT: METER LIST ============ */}
        <div className="list-panel">
          <div className="list-header">
            <h2>
              {manager ? '📋 All Meters' : '📋 My Meters'} ({meters.length})
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {manager && meters.length > 0 && (
                <button className="select-all-btn" onClick={selectAll}>
                  {selectedIds.length === meters.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
              {meters.length > 0 && (
                <button className="clear-btn" onClick={clearAll}>Clear All</button>
              )}
            </div>
          </div>

          {Object.keys(metersByCity).length > 0 && (
            <div className="city-breakdown">
              {Object.entries(metersByCity).map(([prefix, list]) => (
                <span key={prefix} className="city-chip">
                  {prefix}: {list.length}
                </span>
              ))}
            </div>
          )}

          <div className="meter-table">
            {meters.length === 0 ? (
              <p className="empty-msg">
                {manager
                  ? 'No meters yet. Add manually, upload a CSV, or use Bulk Generate.'
                  : 'No meters assigned yet. Contact your manager.'}
              </p>
            ) : (
              meters.map((m) => (
                <div
                  key={m.id}
                  className={`meter-row ${selectedIds.includes(m.id) ? 'selected' : ''}`}
                >
                  {manager && (
                    <input
                      type="checkbox"
                      className="meter-checkbox"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => toggleSelect(m.id)}
                    />
                  )}
                  <span className="mid">{m.meter_id}</span>
                  <span className="mname">{m.name}</span>
                  <span className={'prio p' + m.priority}>P{m.priority}</span>
                  {m.is_overdue && <span className="overdue">OVERDUE</span>}
                  {manager && m.assigned_to && (
                    <span className="assigned-badge">
                      👤 {getTechName(m.assigned_to)}
                    </span>
                  )}
                  {manager && !m.assigned_to && (
                    <span className="unassigned-badge">Unassigned</span>
                  )}
                  <button className="del" onClick={() => del(m.id)}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}