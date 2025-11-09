import {useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../api/API.mjs';

const categories = [
    {id: 1, name: 'Water Supply – Drinking Water'},
    {id: 2, name: 'Architectural Barriers'},
    {id: 3, name: 'Sewer System'},
    {id: 4, name: 'Public Lighting'},
    {id: 5, name: 'Waste'},
    {id: 6, name: 'Road Signs and Traffic Lights'},
    {id: 7, name: 'Roads and Urban Furnishings'},
    {id: 8, name: 'Public Green Areas and Playgrounds'},
    {id: 9, name: 'Other'}
];

export default function CitizenPage(){
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [address, setAddress] = useState('');
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [catId, setCatId] = useState('');
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

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

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 3) {
            setSubmitMessage('Maximum 3 images allowed');
            return;
        }
        setImages(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
        setSubmitMessage('');
    };

    const removeImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImages(newImages);
        setImagePreviews(newPreviews);
        URL.revokeObjectURL(imagePreviews[index]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedLocation) {
            setSubmitMessage('Please select a location on the map');
            return;
        }
        if (!title.trim()) {
            setSubmitMessage('Title is required');
            return;
        }
        if (!description.trim()) {
            setSubmitMessage('Description is required');
            return;
        }
        if (!catId) {
            setSubmitMessage('Category is required');
            return;
        }
        if (images.length === 0 || images.length > 3) {
            setSubmitMessage('Please select 1 to 3 images');
            return;
        }

        setSubmitting(true);
        setSubmitMessage('');

        try {
            const reportData = {
                title: title.trim(),
                description: description,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
                address: address,
                catId: parseInt(catId),
                images: images
            };

            await API.submitReport(reportData);
            setSubmitMessage('Report submitted successfully!');

            setTitle('');
            setDescription('');
            setCatId('');
            setImages([]);
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
            setImagePreviews([]);

            setTimeout(() => {
                clearSelection();
            }, 2000);

            setTimeout(() => {
                setSubmitMessage('');
            }, 7000);
        } catch (error) {
            setSubmitMessage(error.message || 'Error submitting report');
        } finally {
            setSubmitting(false);
        }
    };

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

            {submitMessage && submitMessage.includes('success') && (
                <div>
                    {submitMessage}
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <div ref={mapRef} style={{ height: '600px', flex: '0 0 70%' }} />

                <div style={{ flex: '1', padding: '10px' }}>
                    {selectedLocation ? (
                        <>
                            <div style={{padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px'}}>
                                <strong>Selected Location:</strong>
                                <p>Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                                <p>Address: {loadingAddress ? 'Fetching address...' : address}</p>
                                <button onClick={clearSelection}>Reset Location</button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <h3>Report Details</h3>

                                <div style={{marginBottom: '15px'}}>
                                    <label>Title *</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        style={{width: '100%'}}
                                        required
                                    />
                                </div>

                                <div style={{marginBottom: '15px'}}>
                                    <label>Description *</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        style={{width: '100%'}}
                                        required
                                    />
                                </div>

                                <div style={{marginBottom: '15px'}}>
                                    <label>Category *</label>
                                    <select
                                        value={catId}
                                        onChange={(e) => setCatId(e.target.value)}
                                        style={{width: '100%'}}
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{marginBottom: '15px'}}>
                                    <label>Photos (1-3 required) *</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                    />
                                    {imagePreviews.length > 0 && (
                                        <div
                                            style={{marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} style={{position: 'relative'}}>
                                                    <img src={preview} alt={`Preview ${index + 1}`}
                                                         style={{width: '80px', height: '80px', objectFit: 'cover'}}/>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-5px',
                                                            right: '-5px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {submitMessage && !submitMessage.includes('success') && (
                                    <div>
                                        {submitMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{cursor: submitting ? 'not-allowed' : 'pointer'}}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </form>
                        </>
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
