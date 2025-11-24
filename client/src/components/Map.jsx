import { useEffect, useRef } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';

export default function Map(props) {
    const { lat, lng } = props;

    const mapRef = useRef(null);
    const bufferLayerRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current) return;

        if (!mapRef.current._leaflet_id) {
            const map = L.map(mapRef.current).setView([lat, lng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map);

            L.marker([lat, lng]).addTo(map);
            mapRef.current._mapInstance = map;
        }
    
        const map = mapRef.current._mapInstance;
        map.setView([lat, lng]);

        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
            map.removeLayer(layer);
            }
        });

        L.marker([lat, lng]).addTo(map);

        if(bufferLayerRef.current) map.removeLayer(bufferLayerRef.current);
        const point = turf.point([lng, lat]);
        const buffered = turf.buffer(point, 1, { units: 'kilometers' });
        const geoJsonLayer = L.geoJSON(buffered, { color: 'red' });
        bufferLayerRef.current = geoJsonLayer;
    }, [lat, lng]);

    return (
        <div ref={mapRef} style={{ width: "50%", height: "250px" }} />
    );
}
