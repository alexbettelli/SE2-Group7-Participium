import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function CitizenPage(){
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [address, setAddress] = useState('');
    const [loadingAddress, setLoadingAddress] = useState(false);

    useEffect(() => {
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([45.0703, 7.6868], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstanceRef.current);

            mapInstanceRef.current.on('click', async (e) => {
                const { lat, lng } = e.latlng;

                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }

                if (markerRef.current) {
                    mapInstanceRef.current.removeLayer(markerRef.current);
                }

                markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
                setSelectedLocation({ lat, lng });
                setAddress('');
                setLoadingAddress(true);

                abortControllerRef.current = new AbortController();

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                        {
                            headers: {
                                'User-Agent': 'Participium-CitizenApp'
                            },
                            signal: abortControllerRef.current.signal
                        }
                    );
                    const data = await response.json();
                    setAddress(data.display_name || 'Address not available');
                    setLoadingAddress(false);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        setAddress('Address not available');
                        setLoadingAddress(false);
                    }
                }
            });
        }
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const clearSelection = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (markerRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
        }
        setSelectedLocation(null);
        setAddress('');
        setLoadingAddress(false);
    };

    return(
        <>
            <h2>Welcome to Participium - City of Turin</h2>
            <p>Report issues in your city and help make Turin a better place for everyone.</p>
            <p>Click on the map to select the location for your report.</p>

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <div ref={mapRef} style={{ height: '600px', flex: '0 0 70%' }} />

                <div style={{ flex: '1', padding: '10px' }}>
                    {selectedLocation ? (
                        <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                            <strong>Selected Location:</strong>
                            <p>Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                            <p>Address: {loadingAddress ? 'Fetching address...' : address}</p>
                            <button onClick={clearSelection}>Reset Location</button>
                        </div>
                    ) : (
                        <div style={{ padding: '10px', color: '#666' }}>
                            <p>Select a location on the map</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
