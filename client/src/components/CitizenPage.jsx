import '../styles/CitizenPage.css';

import { useEffect, useRef, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.js';
import '@fortawesome/fontawesome-free/css/all.css';
import * as turf from '@turf/turf';

import ReportOverview from './ReportOverview.jsx';
import ReportPopup from './ReportPopUp.jsx';
import ReactDOM from "react-dom/client";

import GenericAPI from '../api/GenericAPI.mjs';
import ReportAPI from '../api/ReportAPI.mjs';

export default function CitizenPage({ user }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const clusterGroupRef = useRef(null);

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
    const [reports, setReports] = useState([]);
    const [approvedReports, setApprovedReports] = useState([]);
    const [reportDetails, setReportDetails] = useState({});
    const [locationError, setLocationError] = useState('');
    const getStatusClass = (status) => {
        switch (status) {
            case 'Resolved':
                return 'status-completed'; // Verde
            case 'Pending Approval':
                return 'status-pending'; // Giallo/Arancione
            case 'Rejected':
                return 'status-rejected'; // Rosso
            case 'In Progress':
                return 'status-in-progress'; // Blu/Azzurro
            default:
                return 'status-default'; // Grigio/Default
        }
    };
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
    const addLegendToMap = (map, categoryColors) => {
        const legend = L.control({ position: "topright" });
        legend.onAdd = function () {
            const div = L.DomUtil.create("div", "map-legend-collapsible");
            let listItems = "";
            for (const [category, color] of Object.entries(categoryColors)) {
                listItems += `<li><span style="background:${color}"></span> ${category}</li>`;
            }

            div.innerHTML = `
                <button class="legend-toggle-btn" aria-label="Show/hide legend">Show Legend</button>
                <div class="legend-content">
                    <h4>Legend</h4>
                    <ul>
                        ${listItems}
                    </ul>
                </div>
            `;
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);

            // Collapse by default
            div.querySelector('.legend-content').style.display = 'none';
            div.querySelector('.legend-toggle-btn').onclick = function () {
                const content = div.querySelector('.legend-content');
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    this.textContent = 'Hide Legend';
                } else {
                    content.style.display = 'none';
                    this.textContent = 'Legenda';
                }
            };
            return div;
        };
        legend.addTo(map);
    };
    useEffect(() => {
        getAllReports();
    }, []);

    const getAllReports = async () => {
        try {
            const reports = await ReportAPI.getAllReports();
            setReports(reports);
            const approvedReports = reports.filter(report => [2, 3, 4].includes(report.status.id));
            setApprovedReports(approvedReports);
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    }
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cats = await GenericAPI.getCategories();
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

            // Add categpory legend
            addLegendToMap(mapInstanceRef.current, categoryColors);
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
                    mapInstanceRef.current.setView([45.0703, 7.6868], 10);
                    mapInstanceRef.current._turinBoundary = boundaryLayer;
                })
                .catch(err => console.error("Error loading Turin boundary:", err));

            mapInstanceRef.current.on('click', async (e) => {
                const { lat, lng } = e.latlng;

                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }

                if (markerRef.current) {
                    mapInstanceRef.current.removeLayer(markerRef.current);
                }


                markerRef.current = L.marker([lat, lng], { icon: getMarkerIcon() }).addTo(mapInstanceRef.current);
                setSelectedLocation({ lat, lng });
                setActiveTab('form');

                const boundary = mapInstanceRef.current._turinBoundary;
                let isInside = true;

                if (boundary) {
                    const point = turf.point([lng, lat]);
                    const boundaryGeoJSON = boundary.toGeoJSON();
                    isInside = boundaryGeoJSON.features.some(feature =>
                        turf.booleanPointInPolygon(point, feature)
                    );
                }

                if (!isInside) {
                    setLocationError("Please select a location inside the City of Turin.");
                    setAddress('');
                    setLoadingAddress(false);
                    return;
                }

                setLocationError('');
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

    useEffect(() => {
        if (!mapInstanceRef.current) return;

        // Rimuovi cluster precedente
        if (clusterGroupRef.current) {
            mapInstanceRef.current.removeLayer(clusterGroupRef.current);
        }

        // Crea il gruppo cluster
        const clusterGroup = L.markerClusterGroup({
            maxClusterRadius: 80,
            disableClusteringAtZoom: 17,
            zoomToBoundsOnClick: true,
            iconCreateFunction: (cluster) => {
                const count = cluster.getChildCount();
                let color;
                if (count < 10) color = "#4caf50";
                else if (count < 15) color = "#f1c40f";
                else if (count < 20) color = "#e67e22";
                else color = "#e74c3c";

                return L.divIcon({
                    html: `<div style="
                        background:${color};
                        width:35px;
                        height:35px;
                        border-radius:50%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        color:#fff;
                        font-weight:600;
                        font-size:14px;
                        border:2px solid white;
                    ">${count}</div>`,
                    className: "clusterGroup",
                    iconSize: [35, 35]
                });
            }
        });

        // Aggiungi marker al gruppo
        approvedReports.forEach((report) => {
            if (report.latitude && report.longitude) {
                const popupContainer = document.createElement("div");
                ReactDOM.createRoot(popupContainer).render(<ReportPopup report={report} handlePopUpDetailsClick={handlePopUpDetailsClick} />);

                const marker = L.marker([report.latitude, report.longitude], {
                    icon: getMarkerIcon(report.category.categoryName)
                }).bindPopup(popupContainer);
                clusterGroup.addLayer(marker);
            }
        });

        // Aggiungi il gruppo alla mappa
        clusterGroup.addTo(mapInstanceRef.current);
        clusterGroupRef.current = clusterGroup;

        // Cleanup
        return () => {
            if (mapInstanceRef.current && clusterGroupRef.current) {
                mapInstanceRef.current.removeLayer(clusterGroupRef.current);
            }
        };
    }, [approvedReports]);


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

            const result = await ReportAPI.submitReport(reportData);

            const reportForOverview = {
                id: result.reportId,
                title: reportData.title,
                description: reportData.description,
                category: categories.find(c => c.id === reportData.catId)?.categoryName || 'Unknown',
                latitude: reportData.latitude,
                longitude: reportData.longitude,
                address: reportData.address,
                images: result.images || [],
                username: isAnonymous || !user ? 'Anonymous' : `${user.username}`,
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
            getAllReports();
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
        setLocationError('');
        if (!keepTab) {
            setActiveTab('reports');
            ResetZoom();
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
        setReportDetails({});
        setLocationError('');
        resetForm();
        //ResetZoom();
    };
    const zoomToReportLocation = (report) => {
        if (report.latitude && report.longitude && mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([report.latitude, report.longitude], 17, {
                animate: true,
                duration: 1.5
            });
        }
    }
    const showReportDetails = (report) => {
        const normalizedReport = {
            ...report,
            status: report.status?.statusName ?? "N/A",
            category: report.category?.categoryName ?? "N/A",
            username: report.user?.username ?? "Anonymous"
        };
        setActiveTab('details');
        setReportDetails(normalizedReport);
        zoomToReportLocation(normalizedReport);
    }
    const handlePopUpDetailsClick = (report) => {
        showReportDetails(report);
    }
    const ResetZoom = () => {
        mapInstanceRef.current.flyTo([45.0703, 7.6868], 10, { animate: true, duration: 1 });
    }
    return (
        <div className="citizen-page-container">
            <div className="citizen-page-header">
                <h2 className="citizen-page-title">Welcome to Participium - City of Turin</h2>
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
                                {approvedReports.length === 0 ? (
                                    <p className="empty-message">THERE ARE NO REPORTS IN PROGRESS</p>
                                ) : (
                                    approvedReports.map((report) => (
                                        <div key={report.id} className="report-card" onClick={() => showReportDetails(report)} style={{ cursor: "pointer", border: "1px solid grey" }}>
                                            <h3>{report.title}</h3>
                                            <p>
                                                <strong>Category:</strong> {report.category?.categoryName}<br />
                                                <strong>Address:</strong> {report.address}
                                                <span className={`status-badge ${getStatusClass(report.status?.statusName)}`}>{report.status?.statusName}</span>
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div className="report-details">
                                {Object.keys(reportDetails).length === 0 ? (
                                    <p className="empty-message">Select a report to show details</p>
                                ) : (
                                    <ReportOverview user={user}
                                        report={reportDetails}
                                        onBackToHome={resetForm}
                                        showSuccessBanner={false}
                                        showNewReportBtn={false}
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === 'form' && (
                            <>
                                {submittedReport ? (
                                    <ReportOverview user={user}
                                        report={submittedReport}
                                        onBackToHome={resetForm}
                                        showSuccessBanner={true}
                                    />
                                ) : selectedLocation ? (
                                    <>
                                        {locationError && (
                                            <div className="error-message">
                                                {locationError}
                                            </div>
                                        )}
                                        <div className="location-info-box">
                                            <div className="location-header">
                                                <strong>Selected Location</strong>
                                                <button className="reset-button" onClick={clearSelection}>
                                                    Reset
                                                </button>
                                            </div>
                                            <p><strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                                            <p><strong>Address:</strong> {loadingAddress ? 'Fetching address...' : address || ''}</p>
                                        </div>

                                        {!locationError && (
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
                                        )}
                                    </>
                                ) : (
                                    <div className="empty-message" style={{ padding: '2rem', textAlign: 'center' }}>
                                        Click on the map to select a location inside the City of Turin.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
