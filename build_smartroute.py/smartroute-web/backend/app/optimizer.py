"""Route Optimization Engine"""
import math
import time
from typing import List, Tuple
from dataclasses import dataclass


@dataclass
class MeterPoint:
    id: str
    lat: float
    lon: float
    priority: int = 3
    is_overdue: bool = False


def haversine(c1, c2):
    lat1, lon1 = c1
    lat2, lon2 = c2
    R = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def get_distance_matrix(points):
    n = len(points)
    m = [[0.0]*n for _ in range(n)]
    for i in range(n):
        for j in range(i+1, n):
            d = haversine(points[i], points[j])
            m[i][j] = d
            m[j][i] = d
    return m


def nearest_neighbor_route(dist, start_idx, candidate_idxs):
    unvisited = set(candidate_idxs)
    route = []
    current = start_idx
    while unvisited:
        nxt = min(unvisited, key=lambda j: dist[current][j])
        route.append(nxt)
        unvisited.remove(nxt)
        current = nxt
    return route


def two_opt(dist, start_idx, route, max_passes=60, time_budget=15.0):
    n = len(route)
    if n < 3:
        return route
    full = [start_idx] + route
    m = len(full)
    improved = True
    passes = 0
    t0 = time.time()
    while improved and passes < max_passes and (time.time() - t0) < time_budget:
        improved = False
        passes += 1
        for i in range(m - 2):
            a, b = full[i], full[i+1]
            dab = dist[a][b]
            for j in range(i+2, m-1):
                c, d = full[j], full[j+1]
                delta = (dist[a][c] + dist[b][d]) - (dab + dist[c][d])
                if delta < -1e-9:
                    full[i+1:j+1] = full[i+1:j+1][::-1]
                    improved = True
                    b = full[i+1]
                    dab = dist[a][b]
    return full[1:]


CITY_CENTERS = {
    "Bengaluru": (12.9716, 77.5946),
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.6139, 77.2090),
    "Chennai": (13.0827, 80.2707),
    "Hyderabad": (17.3850, 78.4867),
}
CITY_BASE_SPEEDS = {
    "Bengaluru": 22, "Mumbai": 20, "Delhi": 25,
    "Chennai": 28, "Hyderabad": 30, "Unknown": 30
}
AREA_MULT = {
    'city_center': 0.7, 'urban': 0.85, 'suburban': 1.0,
    'mixed': 1.15, 'highway': 1.5
}


def detect_city(meters, start):
    if not meters:
        return "Unknown"
    lats = [start[0]] + [m.lat for m in meters]
    lons = [start[1]] + [m.lon for m in meters]
    centroid = (sum(lats)/len(lats), sum(lons)/len(lons))
    best, best_d = "Unknown", float('inf')
    for city, c in CITY_CENTERS.items():
        d = haversine(centroid, c)
        if d < best_d:
            best_d = d
            best = city
    return best if best_d < 30 else "Unknown"


def detect_area_type(meters, start):
    if not meters:
        return "urban"
    pts = [start] + [(m.lat, m.lon) for m in meters]
    avg = sum(haversine(pts[i], pts[i+1]) for i in range(len(pts)-1)) / max(1, len(pts)-1)
    lats = [p[0] for p in pts]
    lons = [p[1] for p in pts]
    spread = max(max(lats)-min(lats), max(lons)-min(lons)) * 111
    if avg < 1.5 and spread < 15:
        return "city_center"
    elif avg < 3 and spread < 30:
        return "urban"
    elif avg < 5 and spread < 50:
        return "suburban"
    elif avg > 8:
        return "highway"
    return "mixed"


def calculate_dynamic_speed(meters, start):
    if not meters:
        return 30.0
    city = detect_city(meters, start)
    base = CITY_BASE_SPEEDS.get(city, 30)
    lats = [m.lat for m in meters]
    lons = [m.lon for m in meters]
    area = max((max(lats)-min(lats)) * 111 * (max(lons)-min(lons)) * 111, 0.1)
    density = len(meters) / area
    if density > 50: dm = 0.6
    elif density > 20: dm = 0.75
    elif density > 5: dm = 0.9
    else: dm = 1.1
    am = AREA_MULT.get(detect_area_type(meters, start), 1.0)
    c = len(meters)
    if c > 500: cm = 0.75
    elif c > 200: cm = 0.85
    elif c > 100: cm = 0.9
    else: cm = 1.1
    return max(15, min(80, round(base * dm * am * cm, 1)))


class RouteOptimizer:
    def __init__(self, meters, start):
        self.meters = meters
        self.start = start
        self.optimized_sequence = []
        self.avg_speed_kmph = calculate_dynamic_speed(meters, start)
        self.detected_area = detect_area_type(meters, start)
        self.detected_city = detect_city(meters, start)
        self.before_distance_km = 0.0
        self.after_distance_km = 0.0
        self.before_travel_time_min = 0.0
        self.after_travel_time_min = 0.0
        self.optimization_time_sec = 0.0

    def _tier(self, m):
        return 0 if m.is_overdue else m.priority

    def _dist(self, seq):
        if not seq: return 0.0
        prev = self.start
        t = 0.0
        for m in seq:
            t += haversine(prev, (m.lat, m.lon))
            prev = (m.lat, m.lon)
        return t

    def optimize(self):
        if not self.meters:
            return []
        self.before_distance_km = self._dist(self.meters)
        self.before_travel_time_min = self.before_distance_km / (self.avg_speed_kmph/60)
        t0 = time.time()
        pts = [self.start] + [(m.lat, m.lon) for m in self.meters]
        dist = get_distance_matrix(pts)
        m2i = {id(m): i+1 for i, m in enumerate(self.meters)}
        tiers = {}
        for m in self.meters:
            tiers.setdefault(self._tier(m), []).append(m)
        ordered = []
        anchor = 0
        for k in sorted(tiers.keys()):
            tier = tiers[k]
            cand = [m2i[id(m)] for m in tier]
            nn = nearest_neighbor_route(dist, anchor, cand)
            imp = two_opt(dist, anchor, nn)
            i2m = {m2i[id(m)]: m for m in tier}
            for idx in imp:
                ordered.append(i2m[idx])
            if imp:
                anchor = imp[-1]
        self.optimized_sequence = ordered
        self.after_distance_km = self._dist(ordered)
        self.after_travel_time_min = self.after_distance_km / (self.avg_speed_kmph/60)
        self.optimization_time_sec = time.time() - t0
        return ordered

    def get_summary(self):
        saved_km = self.before_distance_km - self.after_distance_km
        saved_min = self.before_travel_time_min - self.after_travel_time_min
        imp = (saved_km / self.before_distance_km * 100) if self.before_distance_km > 0 else 0
        return {
            'before_distance_km': round(self.before_distance_km, 2),
            'after_distance_km': round(self.after_distance_km, 2),
            'saved_distance_km': round(saved_km, 2),
            'improvement_percent': round(imp, 2),
            'before_travel_time_min': round(self.before_travel_time_min, 2),
            'after_travel_time_min': round(self.after_travel_time_min, 2),
            'saved_travel_time_min': round(saved_min, 2),
            'avg_speed_kmph': self.avg_speed_kmph,
            'detected_area': self.detected_area,
            'detected_city': self.detected_city,
            'total_meters': len(self.optimized_sequence),
            'optimization_time_sec': round(self.optimization_time_sec, 3)
        }
