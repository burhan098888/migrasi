import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { format } from "date-fns";

// Fix default marker icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom colored icons for check-in (green) and check-out (red)
const checkInIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const checkOutIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type LocationRecord = {
  _id: string;
  date: string;
  userName: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLat: number;
  checkInLng: number;
  checkOutLat?: number;
  checkOutLng?: number;
  status: string;
};

type AttendanceMapProps = {
  records: LocationRecord[];
};

export default function AttendanceMap({ records }: AttendanceMapProps) {
  // Collect all valid coordinates to compute map center and bounds
  const allCoords: [number, number][] = [];
  for (const r of records) {
    if (r.checkInLat !== 0 || r.checkInLng !== 0) {
      allCoords.push([r.checkInLat, r.checkInLng]);
    }
    if (r.checkOutLat && r.checkOutLng && (r.checkOutLat !== 0 || r.checkOutLng !== 0)) {
      allCoords.push([r.checkOutLat, r.checkOutLng]);
    }
  }

  // Default center (Jakarta, Indonesia)
  const defaultCenter: [number, number] = [-6.2088, 106.8456];
  const center: [number, number] =
    allCoords.length > 0
      ? [
          allCoords.reduce((sum, c) => sum + c[0], 0) / allCoords.length,
          allCoords.reduce((sum, c) => sum + c[1], 0) / allCoords.length,
        ]
      : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={allCoords.length > 0 ? 13 : 10}
      className="h-[450px] w-full rounded-lg border"
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {records.map((record) => (
        <MarkerGroup key={record._id} record={record} />
      ))}
    </MapContainer>
  );
}

function MarkerGroup({ record }: { record: LocationRecord }) {
  const dateLabel = format(new Date(record.date + "T00:00:00"), "EEE, d MMM yyyy");

  return (
    <>
      {/* Check-in marker (green) */}
      {(record.checkInLat !== 0 || record.checkInLng !== 0) && (
        <Marker
          position={[record.checkInLat, record.checkInLng]}
          icon={checkInIcon}
        >
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-semibold">{record.userName}</p>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
              <p className="text-green-600 font-medium">
                Check-in: {format(new Date(record.checkInTime), "hh:mm a")}
              </p>
              <p className="text-xs">
                {record.checkInLat.toFixed(5)}, {record.checkInLng.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Check-out marker (red) */}
      {record.checkOutLat &&
        record.checkOutLng &&
        record.checkOutTime &&
        (record.checkOutLat !== 0 || record.checkOutLng !== 0) && (
          <Marker
            position={[record.checkOutLat, record.checkOutLng]}
            icon={checkOutIcon}
          >
            <Popup>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{record.userName}</p>
                <p className="text-xs text-muted-foreground">{dateLabel}</p>
                <p className="text-red-600 font-medium">
                  Check-out: {format(new Date(record.checkOutTime), "hh:mm a")}
                </p>
                <p className="text-xs">
                  {record.checkOutLat.toFixed(5)}, {record.checkOutLng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
    </>
  );
}
