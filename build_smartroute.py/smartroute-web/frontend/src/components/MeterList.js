import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { metersAPI } from '../api/client';

export default function MeterList() {
  const [meters, setMeters] = useState([]);
  const [form, setForm] = useState({
    meter_id: '', name: '', latitude: '', longitude: '',
    priority: 3, is_overdue: false, address: '', city: '', area: ''
  });

  const load = () => metersAPI.list().then((r) => setMeters(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await metersAPI.create({
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      priority: parseInt(form.priority)
    });
    setForm({ meter_id: '', name: '', latitude: '', longitude: '',
      priority: 3, is_overdue: false, address: '', city: '', area: '' });
    load();
  };

  const del = async (id) => {
    if (window.confirm('Delete meter?')) {
      await metersAPI.delete(id);
      load();
    }
  };

  const generateDemo = async () => {
    const demoMeters = [];
    const base = { lat: 12.9716, lon: 77.5946 };
    for (let i = 1; i <= 50; i++) {
      demoMeters.push({
        meter_id: 'BLR-' + String(i).padStart(4, '0'),
        name: 'Meter ' + i,
        latitude: base.lat + (Math.random() - 0.5) * 0.2,
        longitude: base.lon + (Math.random() - 0.5) * 0.2,
        priority: Math.ceil(Math.random() * 5),
        is_overdue: Math.random() < 0.15,
        address: 'Zone ' + (i % 20 + 1) + ', Bengaluru',
        city: 'Bengaluru',
        area: 'Zone ' + (i % 20 + 1)
      });
    }
    await metersAPI.bulk(demoMeters);
    load();
  };

  return (
    <div className="page">
      <nav className="app-nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/meters">Meters</Link>
        <Link to="/optimize">Optimize</Link>
        <Link to="/analytics">Analytics</Link>
      </nav>

      <div className="two-col">
        <div className="form-panel">
          <h2>Add Meter</h2>
          <form onSubmit={submit}>
            <input placeholder="Meter ID" value={form.meter_id}
              onChange={(e) => setForm({...form, meter_id: e.target.value})} required />
            <input placeholder="Name" value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})} required />
            <input type="number" step="any" placeholder="Latitude" value={form.latitude}
              onChange={(e) => setForm({...form, latitude: e.target.value})} required />
            <input type="number" step="any" placeholder="Longitude" value={form.longitude}
              onChange={(e) => setForm({...form, longitude: e.target.value})} required />
            <select value={form.priority}
              onChange={(e) => setForm({...form, priority: e.target.value})}>
              <option value="1">Priority 1 (Highest)</option>
              <option value="2">Priority 2</option>
              <option value="3">Priority 3</option>
              <option value="4">Priority 4</option>
              <option value="5">Priority 5 (Lowest)</option>
            </select>
            <input placeholder="Address" value={form.address}
              onChange={(e) => setForm({...form, address: e.target.value})} />
            <label className="checkbox">
              <input type="checkbox" checked={form.is_overdue}
                onChange={(e) => setForm({...form, is_overdue: e.target.checked})} />
              Overdue
            </label>
            <button type="submit">Add Meter</button>
            <button type="button" onClick={generateDemo} className="secondary">
              Generate 50 Demo Meters
            </button>
          </form>
        </div>

        <div className="list-panel">
          <h2>Meters ({meters.length})</h2>
          <div className="meter-table">
            {meters.map((m) => (
              <div key={m.id} className="meter-row">
                <span className="mid">{m.meter_id}</span>
                <span className="mname">{m.name}</span>
                <span className={'prio p' + m.priority}>P{m.priority}</span>
                {m.is_overdue && <span className="overdue">OVERDUE</span>}
                <button className="del" onClick={() => del(m.id)}>x</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
