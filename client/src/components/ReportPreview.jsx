import React, { useState } from 'react';
import { Button } from 'react-bootstrap'; 
import { useNavigate } from "react-router";

import '../styles/ReportPreview.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; 

export default function ReportPreview(props){
    const { user, report, setSelectedReport } = props;
    const [isExpanded, setIsExpanded] = useState(false); 
    const navigate = useNavigate();
    
    const imagesToDisplay = (report.images && report.images.length > 0) 
        ? report.images.map(photo => photo.imageUrl || photo) 
        : [];


    const getStatusClass = (statusId) => {
        switch (statusId) {
            case 'Completed':
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

    const ExpandedContent = () => (
        <>
            <div className="overview-section">
                <h4 className="section-label">Category</h4>
                <p className="report-field">{report.category?.categoryName}</p>
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
            
            <div className="overview-footer">
                <div className="report-meta">
                    {!(report.anonymous === 1) && report.user?.id && (
                        <span className="author-info">
                            Reported by: {user.username}
                        </span>
                    )}
                    {(report.anonymous === 1) && (
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
        </>
    );

    return (
            <div className="overview-card">

                {/* Blocco 1: Titolo e Status (Sempre Visibili) */}
                <div className="overview-header">
                    <div className="header-content">
                        <h3 className="report-title">{report.title}</h3>
                        <div className="header-badges">
                            <span className="report-id-badge">Report #{report.id}</span>
                            <span className={`status-badge ${getStatusClass(report.status?.statusName)}`}>{report.status?.statusName}</span>
                        </div>
                    </div>
                </div>
                
                {/* Blocco 2: Mostra solo la prima immagine */}
                <div className="overview-section">
                    <h4 className="section-label">First photo of the report</h4>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        {imagesToDisplay.length > 0 ? (
                            <img
                                className="report-photo-img"
                                src={imagesToDisplay[0]}
                                alt="Report photo"
                                onError={e => { e.target.src = 'https://via.placeholder.com/320x240?text=Image+Not+Found'; }}
                            />
                        ) : (
                            <span className="no-photos-message">No photo available</span>
                        )}
                    </div>
                </div>
                
                {/* Blocco 3: Contenuto espandibile */}
                {isExpanded && <ExpandedContent />}

                {/* Blocco 4: Azioni (Pulsante Chat e Toggle Espansione) */}
                <div className="overview-actions">
                    <div className="chat-action-wrapper">
                        <Button className="btn btn-primary" onClick={() => { setSelectedReport(report); navigate('/chat'); }}>
                            <span className="chat-btn-flex">
                                {report.unreadNotifications > 0 ? (
                                    <span className="notification-count-inline"><i className="bi bi-chat-dots-fill report-chat-icon"></i>{report.unreadNotifications}</span>
                                ) : <span><i className="bi bi-chat-dots-fill report-chat-icon"></i></span>}
                                <span>Go to the chat</span>
                            </span>
                        </Button>
                    </div>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <Button 
                            variant="link" 
                            className="btn-expand-toggle"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <>
                                    Show Less <i className="bi bi-chevron-up"></i>
                                </>
                            ) : (
                                <>
                                    Show More Details <i className="bi bi-chevron-down"></i>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

            </div>
    );
};