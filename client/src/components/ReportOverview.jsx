import React from 'react';
import '../styles/ReportOverview.css';

const ReportOverview = ({ report, onBackToHome, showSuccessBanner = true }) => {

    return (
        <div className="report-overview-container">
            {showSuccessBanner && (
                <div className="success-banner">
                    <h2 className="success-title">Report Submitted Successfully!</h2>
                    <p className="success-subtitle">Your report has been saved and will be reviewed by our team.</p>
                </div>
            )}
            
            <div className="overview-card">

                <div className="overview-header">
                    <h3 className="report-title">{report.title}</h3>
                    <div className="header-badges">
                        <span className="report-id-badge">Report #{report.id}</span>
                        <span className="status-badge">{report.status}</span>
                    </div>
                </div>

                <div className="overview-section">
                    <h4 className="section-label">Category</h4>
                    <p className="report-field">{report.category}</p>
                </div>

                <div className="overview-section">
                    <h4 className="section-label">Description</h4>
                    <p className="report-field">{report.description}</p>
                </div>  
                
            {report.address && (
                    <div className="overview-section">
                        <h4 className="section-label">Address</h4>
                        <p className="report-field">{report.address}</p>
                    </div>
                )}
                
                <div className="overview-section">
                    <h4 className="section-label">Location</h4>
                    <div className="location-info">
                        <span>Lat: {report.latitude.toFixed(6)}, Lon: {report.longitude.toFixed(6)}</span>
                    </div>
                </div>

                {report.images && report.images.length > 0 ? (
                    <div className="overview-section">
                        <h4 className="section-label">Attached Photos ({report.images.length})</h4>
                        <div className="photo-gallery">
                            {report.images.map((img) => (
                                <div key={img.id} className="photo-item">
                                    <img 
                                        src={img.imageUrl} 
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="overview-section">
                        <p className="no-photos-message">No photos attached</p>
                    </div>
                )}

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

                 {report.createdAt && (
                 <span className="timestamp-info">
                        Submitted on: {new Date(report.createdAt).toLocaleString('it-IT')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="overview-actions">
                    <button className="btn btn-primary" onClick={onBackToHome}>
                        Submit New Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportOverview;