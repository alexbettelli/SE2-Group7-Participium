import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/ReportPreview.css'

import { useEffect, useState } from 'react';
import { useNavigate } from "react-router";
import { Carousel, Modal, Form } from 'react-bootstrap';

import dayjs from 'dayjs';

import Map from './Map.jsx';
import * as NotFoundImage from '../utils/NotFoundImage.mjs';

import ReportAPI from '../api/ReportAPI.mjs';
import getStatusClass from '../utils/StatusColorsMapper.mjs';

export default function ReportPreview(props) {
    const { report, setSelectedReport } = props;
    const [expanded, setExpanded] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showExternalAssignmentModal, setShowExternalAssignmentModal] = useState(false);
    const [statuses, setStatuses] = useState([]);
    const [updateStatus, setUpdateStatus] = useState(false);
    const [selectedStatusId, setSelectedStatusId] = useState(null);
    const [selectedExternalOfficeId, setSelectedExternalOfficeId] = useState(null);

    const handleClose = () => {
        setShowStatusModal(false);
        document.body.style.overflowY = 'auto';
    }

    const handleShow = () => {
        setShowStatusModal(true);
        document.body.style.overflowY = 'hidden';
    }

    const handleCloseExternalAssignment = () => {
        setShowExternalAssignmentModal(false);
        document.body.style.overflowY = 'auto';
    }

    const handleShowExternalAssignment = () => {
        const defaultId = props.externalOffices && props.externalOffices.length > 0 ? props.externalOffices[0].id : null;
        setSelectedExternalOfficeId(defaultId);
        setShowExternalAssignmentModal(true);
        document.body.style.overflowY = 'hidden';
    }

    const handleExternalAssignment = async () => {
        try {
            await ReportAPI.assignReportToExternalOffice(report.id, selectedExternalOfficeId);
            props.updateReports();
        } catch (error) {
            console.error('Error assigning report to external office:', error);
        }
    };

    const navigate = useNavigate();

    useEffect(() => {
        const getStatuses = async () => {
            ReportAPI.getReportStatuses().then((data) => {
                setStatuses(data);
            }).catch((error) => {
                console.error('Error fetching report statuses:', error);
            });
        };

        getStatuses();
    }, []);

    useEffect(() => {
        const updateReportStatus = async () => {
            try {
                const result = await ReportAPI.updateReportStatus(report.id, selectedStatusId);
                if (result && result.notification) {
                    report.notifications = [...report.notifications, result.notification];
                    setSelectedReport({ ...report });
                }
                if (result.ok) props.updateReports();
            } catch (error) {
                console.error('Error updating report status:', error);
            }
            setUpdateStatus(false);
            setSelectedStatusId(null);
        };
        if (updateStatus && props.user.role.id === 4) updateReportStatus();
    }, [updateStatus]);

    useEffect(() => {
        if (expanded) document.body.style.overflowY = 'hidden';
        else document.body.style.overflowY = 'auto';
    }, [expanded]);

    const getImage = () => {
        if (report && report.images && report.images.length > 0) return report.images[0].imageUrl;
        else return NotFoundImage.not_found_url;
    }

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    return (
        <>
            <div className='report-preview-card' onClick={toggleExpanded}>
                <div className="card-section">
                    <img src={getImage()} alt="Report image" onError={(e) => NotFoundImage.setSrcToNotFound(e)} />
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
                    { report.externalOffice == null ? 
                        <button className='btn-assign-external' type="button" onClick={(e) => { e.stopPropagation(); handleShowExternalAssignment(); }}>
                            <span><i className="bi bi-building"></i> Assign to external company</span>
                        </button>
                        : 
                        <button className="btn-chat" type="button" onClick={(e) => { e.stopPropagation(); setSelectedReport(report);  }}>
                            <span className="chat-btn-flex">
                                <span><i className="bi bi-chat-dots-fill report-chat-icon"></i></span>
                                <span> {report.externalOffice.name}</span>
                            </span>
                        </button>
                    }
                    {
                        props.user.role.id === 4 &&
                        <button className="btn-change-status" type="button" onClick={(e) => { e.stopPropagation(); handleShow(); }}>
                            <span><i className="bi bi-pencil-fill"></i> Change status</span>
                        </button>
                    }

                </div>
            </div>
            {expanded && <ReportView onClose={toggleExpanded} report={report} />}

            <Modal 
                show={showStatusModal} 
                onHide={handleClose}
                dialogClassName="status-modal-dialog"
                contentClassName="status-modal-content"
                backdropClassName="external-assignment-backdrop"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Change status for report #{report.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Select aria-label="Default select example" defaultValue={report.status.id} onChange={(e) => setSelectedStatusId(e.target.value)}>
                        {statuses.map(status => {
                            if (![1, 2, 5].includes(status.id))
                                return <option key={status.id} value={status.id} >{status.statusName}</option>;
                        })}
                    </Form.Select>
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn-close-modal" type="button" onClick={handleClose}>
                        Close
                    </button>
                    <button className="btn-save-modal" type="button" onClick={() => { handleClose(); setUpdateStatus(true); }}>
                        Save Changes
                    </button>
                </Modal.Footer>
            </Modal>
            <Modal
                show={showExternalAssignmentModal}
                onHide={() => setShowExternalAssignmentModal(false)}
                dialogClassName="external-assignment-dialog"
                contentClassName="external-assignment-content"
                backdropClassName="external-assignment-backdrop"
            >
                {/* Modal content for external assignment */}
                <Modal.Header closeButton>
                    <Modal.Title>External companies for 
                        <br />
                        "{report.category.categoryName}"</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Select
                        aria-label="Default select example"
                        className="external-select"
                        value={selectedExternalOfficeId ?? (props.externalOffices[0] && props.externalOffices[0].id) ?? ''}
                        onChange={(e) => setSelectedExternalOfficeId(Number(e.target.value))}
                    >
                        {props.externalOffices.map(office => {
                                return <option key={office.id} value={office.id} >{office.name}</option>;
                        })}
                    </Form.Select>
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn-close-modal" type="button" onClick={handleCloseExternalAssignment}>
                        Close
                    </button>
                    <button className="btn-save-modal" type="button" onClick={() => { handleCloseExternalAssignment(); handleExternalAssignment(); }}>
                        Assign
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

function ReportView(props) {
    const report = props.report;

    const closeReportView = () => {
        props.onClose();
    }

    return (
        <>
            <div id="backdrop" onClick={closeReportView}></div>
            <div className="report-view">
                <div className="report-view-header">
                    <h2>{props.report.title}</h2>
                    <button className="close-button" onClick={closeReportView}><i className="bi bi-x-lg"></i></button>
                </div>
                <div className="report-view-content">
                    <div className="media-container">
                        <div className="carousel-wrapper">
                            <Carousel controls={props.report.images.length > 1} indicators={props.report.images.length > 1}>
                                {props.report.images.map((image, index) => {
                                    return <Carousel.Item key={index}>
                                        <img className="d-block"
                                            src={image.imageUrl}
                                            alt={`Image ${index + 1}`}
                                            onError={(e) => NotFoundImage.setSrcToNotFound(e)}
                                        />
                                    </Carousel.Item>;
                                })}
                            </Carousel>
                        </div>
                        <div className="map-container-popup">
                            <Map lat={report.latitude} lng={report.longitude} category={report.category.categoryName} />
                        </div>
                    </div>

                    <div className="report-details">
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
                                <p><strong>Status: </strong>{report.status.statusName}</p>
                                {report.rejectReason && report.status.id === 5 && <p><strong>Rejection reason: </strong>{report.rejectReason}</p>}
                            </div>
                            <div className="field description-field">
                                <h3>Description</h3>
                                <p>{report.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}