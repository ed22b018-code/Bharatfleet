// Coordinates for a set of Indian cities so distance + mapping work offline.
export type City = { name: string; lat: number; lng: number };

export const CITIES: City[] = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Patna", lat: 25.5941, lng: 85.1376 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { name: "Surat", lat: 21.1702, lng: 72.8311 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { name: "Kanpur", lat: 26.4499, lng: 80.3319 },
  { name: "Indore", lat: 22.7196, lng: 75.8577 },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
  { name: "Guwahati", lat: 26.1445, lng: 91.7362 },
];

export function findCity(name: string): City | undefined {
  return CITIES.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
}

// Haversine straight-line distance in km.
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = deg2rad(b.lat - a.lat);
  const dLng = deg2rad(b.lng - a.lng);
  const lat1 = deg2rad(a.lat);
  const lat2 = deg2rad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}
