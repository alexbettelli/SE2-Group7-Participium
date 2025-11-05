import React from 'react';
import '../styles/reportOverview.css';

const ReportOverview = ({ report, onBackToHome }) => {
    const mockReport = {
        id: 1,
        title: "Dangerous hole in the road in Via Roma",
        description: "A large hole has formed in the road, posing a risk to vehicles and pedestrians.",
        category: "Roads and Urban Furnishings",
        latitude: 45.4642,
        longitude: 9.1900,
        photos: [
            "https://picsum.photos/400/300?random=1",
            "https://picsum.photos/400/300?random=2"
        ],
        isAnonymous: false,
        author: "Mario Rossi",
        createdAt: new Date().toISOString(),
        status: "Pending Approval"
    };

    const currentReport = report || mockReport;



    return (
        <div className="report-overview-container">
            <div className="success-banner">
                <h2 className="success-title">Report Submitted Successfully!</h2>
                <p className="success-subtitle">Your report has been saved and will be reviewed by our team.</p>
            </div>
            
            <div className="overview-card">

                <div className="overview-header">
                    <h3 className="report-title">{currentReport.title}</h3>
                    <span className="status-badge">{currentReport.status}</span>
                </div>

                <div className="overview-section">
                    <h4 className="section-label">Category</h4>
                    <p className="report-field">{currentReport.category}</p>
                </div>

                <div className="overview-section">
                    <h4 className="section-label">Description</h4>
                    <p className="report-description">{currentReport.description}</p>
                </div>  
                
                <div className="overview-section">
                    <h4 className="section-label">Location</h4>
                    <div className="location-info">
                        <span>Lat: {currentReport.latitude.toFixed(6)}, Lon: {currentReport.longitude.toFixed(6)}</span>
                    </div>
                </div>

                <div className="overview-section">
                    <h4 className="section-label">Attached Photos ({currentReport.photos.length})</h4>
                    <div className="photo-gallery">
                        {currentReport.photos.map((photo, index) => (
                            <div key={index} className="photo-item">
                                <img src={photo} alt={`Photo ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overview-footer">
                    <div className="report-meta">
                        {!currentReport.isAnonymous && currentReport.author && (
                            <span className="author-info">
                                Reported by: {currentReport.author}
                            </span>
                        )}
                        {currentReport.isAnonymous && (
                            <span className="author-info anonymous">
                                Anonymous Report
                            </span>
                        )}
                    </div>
                </div>

                <div className="overview-actions">
                    <button className="btn btn-primary" onClick={onBackToHome}>
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportOverview;