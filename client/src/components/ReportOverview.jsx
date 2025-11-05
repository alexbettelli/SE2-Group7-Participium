import React from 'react';
import '../styles/reportOverview.css';

const ReportOverview = ({ report, onBackToHome }) => {

    return (
        <div className="report-overview-container">
            <div className="success-banner">
                <h2 className="success-title">Report Submitted Successfully!</h2>
                <p className="success-subtitle">Your report has been saved and will be reviewed by our team.</p>
            </div>
            
            <div className="overview-card">

                <div className="overview-header">
                    <h3 className="report-title">{report.title}</h3>
                    <span className="status-badge">{report.status}</span>
                </div>

                <div className="overview-section">
                    <h4 className="section-label">Category</h4>
                    <p className="report-field">{report.category}</p>
                </div>

                <div className="overview-section">
                    <h4 className="section-label">Description</h4>
                    <p className="report-description">{report.description}</p>
                </div>  
                
                <div className="overview-section">
                    <h4 className="section-label">Location</h4>
                    <div className="location-info">
                        <span>Lat: {report.latitude.toFixed(6)}, Lon: {report.longitude.toFixed(6)}</span>
                    </div>
                </div>

                <div className="overview-section">
                    <h4 className="section-label">Attached Photos ({report.photos.length})</h4>
                    <div className="photo-gallery">
                        {report.photos.map((photo, index) => (
                            <div key={index} className="photo-item">
                                <img src={photo} alt={`Photo ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overview-footer">
                    <div className="report-meta">
                        {!report.isAnonymous && report.author && (
                            <span className="author-info">
                                Reported by: {report.author}
                            </span>
                        )}
                        {report.isAnonymous && (
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