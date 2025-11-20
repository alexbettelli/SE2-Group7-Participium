import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import '../styles/CitizenPage.css';
import API from '../api/API.mjs';
import ReportOverview from './ReportOverview.jsx';



export default function CitizenPage({user}){
    const navigate = useNavigate();
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
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState('reports');
    const [submittedReport, setSubmittedReport] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cats = await API.getCategories();
                setCategories(cats);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([45.0703, 7.6868], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstanceRef.current);

            // Load Turin boundary
            fetch('/geo/torino.geojson')
                .then(res => res.json())
                .then(geojson => {
                    const boundaryLayer = L.geoJSON(geojson, {
                        style: {
                            color: '#539987',
                            weight: 3,
                            fillOpacity: 0,
                        }
                    }).addTo(mapInstanceRef.current);

                    mapInstanceRef.current.fitBounds(boundaryLayer.getBounds());
                    mapInstanceRef.current._turinBoundary = boundaryLayer;
                })
                .catch(err => console.error("Error loading Turin boundary:", err));

            mapInstanceRef.current.on('click', async (e) => {
                const { lat, lng } = e.latlng;

                // Check if inside Turin boundary
                const boundary = mapInstanceRef.current._turinBoundary;
                if (boundary) {
                    const point = turf.point([lng, lat]);
                    const boundaryGeoJSON = boundary.toGeoJSON();
                    const inside = boundaryGeoJSON.features.some(feature =>
                        turf.booleanPointInPolygon(point, feature)
                    );

                    if (!inside) {
                        alert("Please select a location inside the City of Turin.");
                        return;
                    }
                }


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
                setActiveTab('form');

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
        const newFiles = Array.from(e.target.files);
        const totalFiles = images.length + newFiles.length;

        if (totalFiles > 3) {
            const remainingSlots = 3 - images.length;
            if (remainingSlots > 0) {
                const filesToAdd = newFiles.slice(0, remainingSlots);
                const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
                setImages([...images, ...filesToAdd]);
                setImagePreviews([...imagePreviews, ...newPreviews]);
                setSubmitMessage(`Added ${filesToAdd.length} image(s). Maximum 3 images allowed.`);
            } else {
                setSubmitMessage('Maximum 3 images already selected. Remove some images first.');
            }
            e.target.value = '';
            return;
        }

        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setImages([...images, ...newFiles]);
        setImagePreviews([...imagePreviews, ...newPreviews]);
        setSubmitMessage('');
        e.target.value = '';
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
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setSubmitMessage('Title is required');
            return;
        }
        if (trimmedTitle.length < 5 || trimmedTitle.length > 100) {
            setSubmitMessage('Title must be between 5 and 100 characters');
            return;
        }

        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
            setSubmitMessage('Description is required');
            return;
        }
        if (trimmedDescription.length < 10 || trimmedDescription.length > 255) {
            setSubmitMessage('Description must be between 10 and 255 characters');
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
                title: trimmedTitle,
                description: trimmedDescription,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
                address: address,
                catId: parseInt(catId),
                images: images,
                anonymous: isAnonymous
            };

            const result = await API.submitReport(reportData);

            const reportForOverview = {
                id: result.reportId,
                title: reportData.title,
                description: reportData.description,
                category: categories.find(c => c.id === reportData.catId)?.categoryName || 'Unknown',
                latitude: reportData.latitude,
                longitude: reportData.longitude,
                address: reportData.address,
                photos: result.images || [],
                author: isAnonymous || !user ? 'Anonymous' : `${user.firstName} ${user.lastName}`,
                isAnonymous: isAnonymous || !user,
                status: 'Pending Approval',
                createdAt: result.createdAt || new Date().toISOString()
            };

            setSubmittedReport(reportForOverview);
            setActiveTab('form');
            clearSelection(true);
            setTitle('');
            setDescription('');
            setCatId('');
            setImages([]);
            setImagePreviews([]);
            setIsAnonymous(false);
            setSubmitMessage('Report submitted successfully!');

        } catch (error) {
            setSubmitMessage(error.message || 'Error submitting report');
        } finally {
            setSubmitting(false);
        }
    };

    const clearSelection = (keepTab = false) => {
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
        if (!keepTab) {
            setActiveTab('reports');
        }
    };

    const resetForm = () => {
        setSubmittedReport(null);
        clearSelection(true);
        setTitle('');
        setDescription('');
        setCatId('');
        setImages([]);
        setImagePreviews([]);
        setIsAnonymous(false);
        setSubmitMessage('');
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setSubmitMessage('');
    };

    return (
        <div className="citizen-page-container">
            <div className="citizen-page-header">
                <h2>Welcome to Participium - City of Turin</h2>
                <p>Report issues in your city and help make Turin a better place for everyone.</p>
            </div>

            <div className="citizen-page-content">
                <div className="map-section">
                    <div className="map-container-wrapper">
                        <div ref={mapRef} className="map-container" />
                    </div>
                </div>

                <div className="right-panel">
                    <div className="tabbar">
                        <button
                            className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => handleTabClick('reports')}
                        >
                            Reports
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => handleTabClick('details')}
                        >
                            Report Details
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'form' ? 'active' : ''}`}
                            onClick={() => handleTabClick('form')}
                        >
                            New Report
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'reports' && (
                            <div>
                                <p className="empty-message">Reports will be displayed here</p>
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div className="report-details">
                                <p className="empty-message">Report details will be displayed here</p>
                            </div>
                        )}

                        {activeTab === 'form' && (
                            <>
                                {submittedReport ? (
                                    <ReportOverview
                                        report={submittedReport}
                                        onBackToHome={resetForm}
                                        showSuccessBanner={true}
                                    />
                                ) : selectedLocation ? (
                                    <>
                                        <div className="location-info-box">
                                            <div className="location-header">
                                                <strong>Selected Location</strong>
                                                <button className="reset-button" onClick={clearSelection}>
                                                    Reset
                                                </button>
                                            </div>
                                            <p><strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                                            <p><strong>Address:</strong> {loadingAddress ? 'Fetching address...' : address}</p>
                                        </div>

                                        <form className="report-form" onSubmit={handleSubmit}>
                                            <h3>Report Details</h3>

                                            <div className="form-group">
                                                <label>Title <span>*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Description <span>*</span></label>
                                                <textarea
                                                    className="form-textarea"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Category <span>*</span></label>
                                                <select
                                                    className="form-select"
                                                    value={catId}
                                                    onChange={(e) => setCatId(e.target.value)}
                                                    size="1"
                                                    required
                                                >
                                                    <option value="">Select a category</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>Photos (1-3 required) <span>*</span></label>
                                                <label className="file-input-label">
                                                    <input
                                                        type="file"
                                                        className="file-input"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleImageChange}
                                                    />
                                                    <span className="file-input-button">Choose Files</span>
                                                </label>
                                                {imagePreviews.length > 0 && (
                                                    <div className="image-previews">
                                                        {imagePreviews.map((preview, index) => (
                                                            <div key={index} className="preview-item">
                                                                <img src={preview} alt={`Preview ${index + 1}`} />
                                                                <button
                                                                    type="button"
                                                                    className="remove-image-button"
                                                                    onClick={() => removeImage(index)}
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="form-group">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAnonymous}
                                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                                        className="checkbox-input"
                                                    />
                                                    <span>Submit as anonymous (your name will not be visible in public reports)</span>
                                                </label>
                                            </div>

                                            {submitMessage && !submitMessage.includes('success') && (
                                                <div className="error-message">
                                                    {submitMessage}
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                className="submit-button"
                                                disabled={submitting}
                                            >
                                                {submitting ? 'Submitting...' : 'Submit Report'}
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <p className="empty-message">Please select a location on the map first.</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
