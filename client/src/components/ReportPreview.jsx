import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/ReportPreview.css'

import { useEffect, useState } from 'react';
import { useNavigate } from "react-router";
import { Carousel, Modal, Form } from 'react-bootstrap';

import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import MapComponent from './Map.jsx';
import * as NotFoundImage from '../utils/NotFoundImage.mjs';

import ReportAPI from '../api/ReportAPI.mjs';
import getStatusClass from '../utils/StatusColorsMapper.mjs';

export default function ReportPreview(props) {
    const { report, setSelectedReport, isExternalMaintainer = false, showAcceptButton = false, onAcceptReport, setChatWith } = props;
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
        console.log(props.report);
    }, [])

    useEffect(() => {
        const updateReportStatus = async () => {
            try {
                let result;
                if (isExternalMaintainer) {
                    result = await ReportAPI.updateExternalMaintainerReportStatus(report.id, selectedStatusId);
                } else {
                    result = await ReportAPI.updateReportStatus(report.id, selectedStatusId? selectedStatusId : 3);
                }
                
                if (result) {
                    if (result.notification) 
                        report.notifications = [...report.notifications, result.notification];
                    if (result.comment) 
                        report.comments = [...report.comments, result.comment]; 
                    setSelectedReport({ ...report });
                }
                if (result.ok) props.updateReports();
            } catch (error) {
                console.error('Error updating report status:', error);
                alert('Failed to update status: ' + error.message);
            }
            setUpdateStatus(false);
            setSelectedStatusId(null);
        };
        if (updateStatus && (props.user.role.id === 4 || props.user.role.id === 6)) {
            updateReportStatus();
        }
    }, [updateStatus]);

    useEffect(() => {
        if (expanded) document.body.style.overflowY = 'hidden';
        else document.body.style.overflowY = 'auto';
    }, [expanded]);

    const getImage = () => {
        return report?.images?.[0]?.imageUrl ?? NotFoundImage.not_found_url;
    }

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    const categoryColors = {
        1: "lightblue",
        2: "black",
        3: "darkred",
        4: "purple"
    };

    return (
        <>
            <div className='report-preview-card' onClick={toggleExpanded}>
                <div className="card-section">
                    <img src={getImage()} alt="Report img" onError={(e) => NotFoundImage.setSrcToNotFound(e)} />
                    <div className="map-preview">
                        <MapComponent 
                            lat={report.latitude} 
                            lng={report.longitude} 
                            category={report.category.categoryName} 
                            zoomable={false} 
                            movable={false} 
                        />
                    </div>
                    <div className='card-main-info'>
                        <h3>{report.title}</h3>
                        <h5>{report.address.split(", Piemonte")[0].split(", Turin")[0]}</h5>
                        <div className="wrapper">
                            <span className="report-id-badge">Report #{report.id}</span>
                            {
                                report.office && 
                                <span className='office-badge' style={{backgroundColor: `${categoryColors[report.office.id]}`}}>Office #{report.office.id}</span>
                            }
                            <span className={`status-badge ${getStatusClass(report.status.statusName)}`}>{report.status.statusName}</span>
                        </div>
                    </div>
                </div>
                <div className="card-section actions">

                    {!showAcceptButton && (
                        <div className="chat-btn-notification-wrapper">
                            {report.unreadNotifications > 0 && props.user?.role?.id !== 6 && (
                                <span className="chat-btn-notification-count">{report.unreadNotifications}</span>
                            )}
                            {report.unreadComments > 0 && props.user?.role?.id === 6 && (
                                <span className="chat-btn-notification-count">{report.unreadComments}</span>
                            )}
                            <button className="btn-chat" type="button" onClick={(e) => { e.stopPropagation(); setSelectedReport(report); setChatWith(props.user?.role?.id === 6 ? "maintainer" : "user"); navigate('/chat'); }}>
                                <span className="chat-btn-flex">
                                    <span><i className="bi bi-chat-dots-fill report-chat-icon"></i></span>
                                    <span> Go to the chat</span>
                                </span>
                            </button>
                        </div>
                    )}
                    
                    {showAcceptButton && report.status.id === 2 && (
            <button className="btn-accept" type="button" onClick={(e) => { e.stopPropagation(); onAcceptReport(report.id); }}>
              <i className="bi bi-check-circle"></i>{'Take in Charge '}
            </button>
          )}

          {/* Sezione azioni ufficio tecnico: assegnazione esterna + change status */}
          {props.user?.role?.id === 4 && (
            <>
              {report.externalOffice == null ? (
                <button
                  className="btn-assign-external"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleShowExternalAssignment(); }}
                >
                  <span><i className="bi bi-building"></i>{' '}Assign to external company</span>
                </button>
              ) : (
                <div className="chat-btn-notification-wrapper">
                    {report.unreadComments > 0 && (
                        <span className="chat-btn-notification-count">{report.unreadComments}</span>
                    )}
                    <button
                    className="btn-assign-external"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedReport(report); setChatWith("maintainer"); navigate('/chat');}}
                    >
                    <span className="chat-btn-flex">
                        <span><i className="bi bi-chat-dots-fill report-chat-icon"></i></span>
                        <span>{' '}{report.externalOffice.name}</span>
                    </span>
                    </button>
                </div>
              )}

              <button className="btn-change-status" type="button" onClick={(e) => { e.stopPropagation(); handleShow(); }}>
                <span><i className="bi bi-pencil-fill"></i>{' '}Change status</span>
              </button>
            </>
          )}

          {/* Sezione change status per manutentore esterno (ruolo 6) quando non c’è il bottone di Accept */}
          {props.user?.role?.id === 6 && !showAcceptButton && (
            <button className="btn-change-status" type="button" onClick={(e) => { e.stopPropagation(); handleShow(); }}>
              <span><i className="bi bi-pencil-fill"></i>{' '}Change status</span>
            </button>
          )}
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
                            // Technical Office
                            if (props.user.role.id === 4 && ![1, 2, 5].includes(status.id)) {
                                return <option key={status.id} value={status.id}>{status.statusName}</option>;
                            }
                            // External Maintainer: solo 3 (In Progress) e 6 (Resolved)
                            if (isExternalMaintainer && [3, 6].includes(status.id)) {
                                return <option key={status.id} value={status.id}>{status.statusName}</option>;
                            }
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
                        value={selectedExternalOfficeId ?? props.externalOffices?.[0]?.id ?? ''}
                        onChange={(e) => setSelectedExternalOfficeId(Number(e.target.value))}
                    >
                        {props.externalOffices?.map(office => {
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

ReportPreview.propTypes = {
  report: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    address: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    images: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        imageUrl: PropTypes.string.isRequired,
      })
    ).isRequired,
    user: PropTypes.shape({
      id: PropTypes.number.isRequired,
      username: PropTypes.string,
    }).isRequired,
    category: PropTypes.shape({
      id: PropTypes.number,
      categoryName: PropTypes.string,
    }).isRequired,
    status: PropTypes.shape({
      id: PropTypes.number.isRequired,
      statusName: PropTypes.string.isRequired,
    }).isRequired,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    externalOffice: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
    }),
    office: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
    }),
    anonymous: PropTypes.bool,
    isAnonymous: PropTypes.bool,
    unreadNotifications: PropTypes.number,
    unreadComments: PropTypes.number,
    rejectReason: PropTypes.string,
    notifications: PropTypes.array,
    comments: PropTypes.array,
  }).isRequired,

  externalOffices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string,
      category: PropTypes.shape({
        id: PropTypes.number,
        categoryName: PropTypes.string,
      }),
    })
  ),
  user: PropTypes.shape({
    id: PropTypes.number,
    role: PropTypes.shape({
      id: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
  setSelectedReport: PropTypes.func.isRequired,
  updateReports: PropTypes.func,
  isExternalMaintainer: PropTypes.bool,
  showAcceptButton: PropTypes.bool,
  onAcceptReport: PropTypes.func,
  setChatWith: PropTypes.func.isRequired
};

ReportPreview.defaultProps = {
  externalOffices: [],
  updateReports: () => {},
  isExternalMaintainer: false,
  showAcceptButton: false,
  onAcceptReport: () => {},
};

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
                                {props.report.images.map((image) => {
                                    return <Carousel.Item key={image.id ?? image.imageUrl}>
                                        <img className="d-block"
                                            src={image.imageUrl}
                                            alt={`Img ${image.id ?? image.imageUrl}`}
                                            onError={(e) => NotFoundImage.setSrcToNotFound(e)}
                                        />
                                    </Carousel.Item>;
                                })}
                            </Carousel>
                        </div>
                        <div className="map-container-popup">
                            <MapComponent lat={report.latitude} lng={report.longitude} category={report.category.categoryName} />
                        </div>
                    </div>

                    <div className="report-details">
                        <div className="fields">
                            <div className="field user-field">
                                <h3>Reported by</h3>
                                <p><strong>User id: </strong>{(report.anonymous || report.isAnonymous) ? 'Anonymous' : (report.user.id || 'Unknown')}</p>
                                <p><strong>Username: </strong>
                                    {(report.anonymous || report.isAnonymous) ? 'Anonymous' : (report.user.username || 'Unknown')}
                                </p>
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
                                { report.office && <p><strong>Office ID: </strong>{report.office.id}</p> }
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

ReportView.propTypes = {
  report: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        imageUrl: PropTypes.string.isRequired,
      })
    ).isRequired,
    category: PropTypes.shape({
      categoryName: PropTypes.string,
    }).isRequired,
    user: PropTypes.shape({
      id: PropTypes.number.isRequired,
      username: PropTypes.string,
    }).isRequired,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    address: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.shape({
      id: PropTypes.number,
      statusName: PropTypes.string,
    }),
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    rejectReason: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

