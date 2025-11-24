import React, { use, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap'; 
import { useNavigate } from "react-router";
import { Carousel, Modal, Form } from 'react-bootstrap';
import Map from './Map.jsx';
import dayjs from 'dayjs';

import 'bootstrap-icons/font/bootstrap-icons.css'; 
import '../styles/ReportPreview.css'
import API from '../api/API.mjs';

export default function ReportPreview(props){
    const { report, setSelectedReport } = props;
    const [expanded, setExpanded] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statuses, setStatuses] = useState([]);
    const [updateStatus, setUpdateStatus] = useState(false);
    const [selectedStatusId, setSelectedStatusId] = useState(null);

    const handleClose = () => setShowStatusModal(false);
    const handleShow = () => setShowStatusModal(true);
    const navigate = useNavigate();

    useEffect(() => {
        const getStatuses = async () => {
            API.getReportStatuses().then((data) => {
                setStatuses(data);
            }).catch((error) => {
                console.error('Error fetching report statuses:', error);
            });
        };

        getStatuses();
    }, []);

    useEffect(() => {
        const updateReportStatus = async () => {
            API.updateReportStatus(report.id, selectedStatusId).then((data) => {
                console.log('Report status updated:', data);
            }).catch((error) => {
                console.error('Error updating report status:', error);
            });
            setUpdateStatus(false);
            setSelectedStatusId(null);
        };
        if (updateStatus && props.user.role.id === 4) updateReportStatus();
    }, [updateStatus]);

    const getStatusClass = (statusName) => {
        switch (statusName) {
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

    const getImage = () => {
        if(report && report.images && report.images.length > 0) return report.images[0].imageUrl;
        else return 'http://localhost:3001/images/not_found.jpg';
    }

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    return (
        <>
            <div className='report-preview-card' onClick={toggleExpanded}>
                <div className="card-section">
                    <img src={getImage()} alt="Report image" />
                    <div className='card-main-info'>
                        <h3>{report.title}</h3>
                        <h5>{report.address.split(", Piemonte")[0].split(", Turin")[0]}</h5>
                        <div className="wrapper">
                            <span className="report-id-badge">Report #{report.id}</span>
                            <span className={`status-badge ${getStatusClass(report.status.statusName)}`}>{report.status.statusName}</span>
                        </div>
                    </div>
                </div>
                <div className="card-section actions">
                    <div className="chat-btn-notification-wrapper">
                        {report.unreadNotifications > 0 && (
                            <span className="chat-btn-notification-count">{report.unreadNotifications}</span>
                        )}
                        <button className="btn-chat" type="button" onClick={(e) => { e.stopPropagation(); setSelectedReport(report); navigate('/chat'); }}>
                            <span className="chat-btn-flex">
                                <span><i className="bi bi-chat-dots-fill report-chat-icon"></i></span>
                                <span> Go to the chat</span>
                            </span>
                        </button>
                    </div>
                    {  
                        props.user.role.id === 4 && 
                        <button className="btn-change-status" type="button" onClick={(e) => { e.stopPropagation(); handleShow(); }}>
                            <span><i className="bi bi-pencil-fill"></i> Change status</span>
                        </button>
                    }
                </div>
            </div>
            { expanded && <ReportView onClose={toggleExpanded} report={report} /> }
            
            <Modal show={showStatusModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Change status for report #{report.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Select aria-label="Default select example" onChange={(e) => setSelectedStatusId(e.target.value)}>
                        { statuses.map(status => {
                            return <option key={status.id} value={status.id}>{status.statusName}</option>;
                        }) }
                    </Form.Select>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => {handleClose(); setUpdateStatus(true); }}>
                        Save Changes
                    </Button>
            </Modal.Footer>
        </Modal>
        </>
    )
}

function ReportView(props) {
    const report = props.report;

    return (
        <>
            <div id="backdrop" onClick={props.onClose}></div>
            <div className="report-view">
                <div className="report-view-header">
                    <h2>{props.report.title}</h2>
                    <button className="close-button" onClick={props.onClose}><i className="bi bi-x-lg"></i></button>
                </div>
                <div className="report-view-content">
                    <div className="wrapper">
                        <Carousel>
                            { props.report.images.map((image, index) => {
                                return <Carousel.Item key={index}><img className="d-block" src={image.imageUrl} alt={`Image ${index+1}`} /></Carousel.Item>;
                            }) }
                        </Carousel>
                        <Map lat={report.latitude} lng={report.longitude} />
                    </div>
                    <div className="fields">
                        <div className="field user-field">
                            <h3>Reported by</h3>
                            <p><strong>User id: </strong>{report.user.id}</p>
                            <p><strong>Username: </strong>{report.user.username}</p> 
                        </div>
                        <div className="field">
                            <h3>Reported on</h3>
                            <p><strong>Creation: </strong>{dayjs(report.createdAt).format('DD/MM/YYYY HH:mm')}</p>
                            <p><strong>Last update: </strong>{dayjs(report.updatedAt).format('DD/MM/YYYY HH:mm')}</p>
                        </div>
                        <div className="field">
                            <h3>Address</h3>
                            <p>{report.address.split("Piemonte")[0].split("Turin")[0].trimEnd().replace(/,$/, "")}</p>
                        </div>
                        <div className="field">
                            <h3>Report details</h3>
                            <p><strong>Report ID: </strong>{report.id}</p>
                            <p><strong>status: </strong>{report.status.statusName}</p>
                        </div>
                        <div className="field" style={{ "grid-column": "span 2" }}>
                            <h3>Description</h3>
                            <p>{report.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

/*export default function ReportPreview(props){
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

                {/* Blocco 1: Titolo e Status (Sempre Visibili) *//*}
                <div className="overview-header">
                    <div className="header-content">
                        <h3 className="report-title">{report.title}</h3>
                        <div className="header-badges">
                            <span className="report-id-badge">Report #{report.id}</span>
                            <span className={`status-badge ${getStatusClass(report.status?.statusName)}`}>{report.status?.statusName}</span>
                        </div>
                    </div>
                </div>
                
                {/* Blocco 2: Mostra solo la prima immagine *//*}
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
                
                {/* Blocco 3: Contenuto espandibile *//*}
                {isExpanded && <ExpandedContent />}

                {/* Blocco 4: Azioni (Pulsante Chat e Toggle Espansione) *//*}
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
*/