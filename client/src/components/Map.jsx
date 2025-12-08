import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.js';
import '@fortawesome/fontawesome-free/css/all.css';

export default function MapComponent(props) {
    const { lat, lng, category } = props;

    const mapRef = useRef(null);
    const bufferLayerRef = useRef(null);

    const categoryColors = {
        "Roads and Infrastructure": "lightblue",
        "Waste and Cleanliness": "black",
        "Green Areas and Public Parks": "darkred",
        "Public Transport and Mobility": "purple"
    };
    const getMarkerIcon = (categoryName) => {
        const color = categoryColors[categoryName] || "blue"; // Default color        
        return L.AwesomeMarkers.icon({
            icon: 'fa-circle',
            markerColor: color,
            prefix: 'fa',
            iconColor: 'white'
        });
    }
    useEffect(() => {
        if (!mapRef.current) return;

        if (!mapRef.current._leaflet_id) {
            const map = L.map(mapRef.current).setView([lat, lng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map);

            L.marker([lat, lng], { icon: getMarkerIcon(category) }).addTo(map);
            mapRef.current._mapInstance = map;
        }

        const map = mapRef.current._mapInstance;
        map.setView([lat, lng]);

        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        L.marker([lat, lng], { icon: getMarkerIcon(category) }).addTo(map);

        if (bufferLayerRef.current) map.removeLayer(bufferLayerRef.current);
        const point = turf.point([lng, lat]);
        const buffered = turf.buffer(point, 1, { units: 'kilometers' });
        const geoJsonLayer = L.geoJSON(buffered, { color: 'red' });
        bufferLayerRef.current = geoJsonLayer;
    }, [lat, lng]);

    return (
        <div ref={mapRef} style={{ width: "50%", height: "250px" }} />
    );
}

MapComponent.propTypes = {
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired
};
