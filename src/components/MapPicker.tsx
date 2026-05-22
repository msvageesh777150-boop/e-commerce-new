import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, Search } from 'lucide-react';

interface LocationInfo {
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelected: (location: LocationInfo) => void;
}

export default function MapPicker({
  initialLat = 20.5937,
  initialLng = 78.9629,
  onLocationSelected
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [addressDetails, setAddressDetails] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    setAddressDetails('PENDING');
    onLocationSelected({
      address: 'PENDING',
      city: 'PENDING',
      district: 'PENDING',
      state: 'PENDING',
      pincode: 'PENDING',
      latitude: lat,
      longitude: lng
    });
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      );
      if (!response.ok) throw new Error('Geocoding fault');
      const data = await response.json();
      
      const addr = data.address || {};
      const formattedAddress = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
      // Better extraction for District and City
      const district = addr.county || addr.state_district || addr.city_district || addr.district || 'Unknown';
      const city = addr.city || addr.town || addr.village || addr.suburb || district;
      const state = addr.state || 'Unknown';
      const pincode = addr.postcode || '';

      setAddressDetails(formattedAddress);
      onLocationSelected({
        address: formattedAddress,
        city: city !== 'Unknown' ? city : district,
        district,
        state,
        pincode,
        latitude: lat,
        longitude: lng
      });
      
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], mapRef.current.getZoom() || 15);
      }
    } catch (e) {
      console.error('Reverse geocode failure:', e);
      const fallbackAddr = `Selected Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddressDetails(fallbackAddr);
      onLocationSelected({
        address: fallbackAddr,
        city: 'Detected City',
        district: 'Detected Area',
        state: 'State',
        pincode: '',
        latitude: lat,
        longitude: lng
      });
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        updateMapPosition(newLat, newLng);
      } else {
        alert('Location not found');
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    try {
      if (L.Icon && L.Icon.Default) {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      }
    } catch (err) {
      console.warn('Leaflet icon rewrite skipped:', err);
    }

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      markerRef.current = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(mapRef.current);

      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        setCoords({ lat, lng });
        reverseGeocode(lat, lng);
      });

      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng);
      });

      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 100);
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 500);
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 1500);
      
      try {
        if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
          const observer = new ResizeObserver(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
            }
          });
          observer.observe(mapContainerRef.current);
          (mapRef as any)._resizeObserver = observer;
        }
      } catch (err) {}

      reverseGeocode(coords.lat, coords.lng);
    }

    return () => {
      try {
        const observer = (mapRef as any)._resizeObserver;
        if (observer) observer.disconnect();
      } catch (e) {}
    };
  }, []);

  const updateMapPosition = (lat: number, lng: number) => {
    const L = (window as any).L;
    if (!L || !mapRef.current || !markerRef.current) return;
    mapRef.current.flyTo([lat, lng], 15);
    markerRef.current.setLatLng([lat, lng]);
    setCoords({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMapPosition(latitude, longitude);
      },
      (error) => {
        console.error('GPS Detection error:', error);
        setLoading(false);
        updateMapPosition(12.9716, 77.5946);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5 font-display">
          <MapPin className="h-4.5 w-4.5 text-indigo-600" />
          Map Picker
        </span>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={loading || searchLoading}
          className="cursor-pointer text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors border border-indigo-100"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin text-indigo-600" /> : <Navigation className="h-3 w-3" />}
          Detect GPS
        </button>
      </div>

      <div className="relative flex items-center w-full">
        <div className="absolute left-3 text-gray-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              searchLocation(e);
            }
          }}
          placeholder="Search for an area or city..."
          className="w-full bg-white pl-9 pr-24 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
        />
        <button
          type="button"
          onClick={(e) => searchLocation(e)}
          disabled={searchLoading || !searchQuery.trim()}
          className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
        >
          {searchLoading ? <Loader2 className="h-3 w-3 animate-spin text-white" /> : 'Search'}
        </button>
      </div>

      <div className="relative h-60 w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        
        {loading && (
          <div className="absolute inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-white px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2.5 border border-gray-100 text-sm font-semibold text-gray-800">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              Updating Location...
            </div>
          </div>
        )}
      </div>

      {addressDetails && addressDetails !== 'PENDING' && (
        <p className="text-[10px] text-gray-500 font-mono italic bg-gray-50 p-2 rounded-lg border border-gray-100 line-clamp-2">
          {addressDetails}
        </p>
      )}
    </div>
  );
}
