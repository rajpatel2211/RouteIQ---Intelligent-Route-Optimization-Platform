import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const priorityColors = { 1: '#ff6b00', 2: '#3388ff', 3: '#00a651', 4: '#9b59b6', 5: '#95a5a6' };

const createIcon = (color) => L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:' + color + ';width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function RouteMap({ startPoint, meters, sequence }) {
  if (!startPoint || !meters || meters.length === 0) {
    return <div className="map-placeholder">No route to display. Optimize first.</div>;
  }

  const pathCoords = [startPoint];
  const meterMap = {};
  meters.forEach((m) => { meterMap[m.meter_id] = m; });
  (sequence || []).forEach((id) => {
    const m = meterMap[id];
    if (m) pathCoords.push([m.latitude, m.longitude]);
  });
  pathCoords.push(startPoint);

  const startIcon = L.divIcon({
    className: 'start-marker',
    html: '<div style="background:red;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;font-size:14px;font-weight:bold;box-shadow:0 0 8px rgba(0,0,0,0.6)">S</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  return (
    <MapContainer center={startPoint} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="OpenStreetMap"
      />
      <Marker position={startPoint} icon={startIcon}>
        <Popup><b>Start Point</b></Popup>
      </Marker>
      {(sequence || []).map((id, idx) => {
        const m = meterMap[id];
        if (!m) return null;
        const color = m.is_overdue ? '#cc0000' : (priorityColors[m.priority] || '#3388ff');
        return (
          <Marker key={id} position={[m.latitude, m.longitude]} icon={createIcon(color)}>
            <Popup>
              <b>#{idx + 1}: {m.name}</b><br />
              ID: {m.meter_id}<br />
              Priority: P{m.priority} {m.is_overdue ? 'OVERDUE' : ''}<br />
              {m.address}
            </Popup>
          </Marker>
        );
      })}
      {pathCoords.length > 1 && (
        <Polyline positions={pathCoords} color="#3388ff" weight={3} opacity={0.7} />
      )}
    </MapContainer>
  );
}
