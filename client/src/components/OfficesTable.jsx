import { useEffect } from 'react';
import { useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import ReportAPI from '../api/ReportAPI.mjs';
import OfficeAPI from '../api/OfficeAPI.mjs';

export default function OfficesTable({offices, user, retrieve}) {
    const [show, setShow] = useState(false);
    const [selectedOfficeId, setSelectedOfficeId] = useState(null);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <div className="offices-list-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2 className="offices-list-title" style={{ textAlign: 'center', width: '100%' }}>Offices</h2>
                <Table className="offices-list-table" hover style={{ tableLayout: 'fixed', margin: '0 auto' }}>
                    <thead>
                    <tr style={{ textAlign: 'center' }}>
                        <th> Office ID </th>
                        <th> Name </th>
                        <th> Category </th>
                        <th> Actions </th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        offices.map((office, index) => {
                        return (
                            <tr key={index}>
                                <td>{office.id}</td>
                                <td>{office.name}</td>
                                <td>{office.category.categoryName}</td>
                                <td style={{display: "flex", justifyContent: "center", alignItems: "center" }}>
                                    <Button className='btn btn-primary' onClick={() => { setSelectedOfficeId(office.id); handleShow(); }}>Delete</Button>
                                </td>
                            </tr>
                        )
                        })
                    }
                    </tbody>
                </Table>
            </div>
            {
                show && <DeleteOfficeModal show={show} handleClose={handleClose} officeId={selectedOfficeId} user={user} offices={offices} retrieve={retrieve} />
            }
        </>
    )
}

function DeleteOfficeModal({show, handleClose, officeId, user, offices, retrieve}) {
    const [inProgressReports, setInProgressReports] = useState(undefined);
    const [data, setData] = useState({});
    const [error, setError] = useState(null);

    const handleChange = (reportId, newOfficeId) => {
        setData(prevData => ({
            ...prevData,
            [reportId]: newOfficeId
        }));
    }

    useEffect(() => {
        console.log(data);
    }, [data]);

    const deleteoffice = async (data) => {
        if(Object.keys(data).length !== Object.keys(inProgressReports).length) {
            setError('Please reassign all in-progress reports before deleting the office.');
            return;
        };
        Object.entries(data).map(([reportId, newOfficeId]) => {
            if(!newOfficeId || !offices.map(o => o.id).includes(newOfficeId)) {
                setError('Please select valid offices for all reports.');
                return;
            };
        });

        if(Object.keys(data).length > 0) {
            ReportAPI.reassignReports(data).then(() => {
                console.log("Reassignment completed.");
                OfficeAPI.deleteOfficeById(officeId).then(() => {
                    console.log("Office deletion completed.");
                    handleClose();
                    retrieve();
                }).catch(err => {
                    console.error('Error deleting office:', err);
                    setError('Error deleting office. Please try again.');
                });
            }).catch(err => {
                console.error('Error reassigning reports:', err);
                setError('Error reassigning reports. Please try again.');
            });
        } else {
            OfficeAPI.deleteOfficeById(officeId).then(() => {
                console.log("Office deletion completed.");
                handleClose();
                retrieve();
            }).catch(err => {
                console.error('Error deleting office:', err);
                setError('Error deleting office. Please try again.');
            });
        }
    }

    useEffect(() => {
        const getInProgressReports = async (officeId) => {
            ReportAPI.getInProgressReportsAssignedToOffice(officeId).then(reports => {
                console.log('In-progress reports for office:', reports);
                setInProgressReports(reports);
            }).catch(err => {
                console.error('Error fetching in-progress reports for office:', err);
            })
        }

        getInProgressReports(officeId);
    }, [officeId]);

    return (
        <Modal show={show} onHide={handleClose} size='lg'>
            <Modal.Header closeButton style={{ backgroundColor: 'var(--color-wine-dark)', color: '#fff' }}>
                <Modal.Title style={{ color: '#fff' }}>Delete office #{officeId}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {
                    (inProgressReports && Object.keys(inProgressReports).length > 0) ? 
                        <>
                            <h6>Reassign in-progress reports before deleting this office.</h6>
                            { error && <p style={{ color: 'red' }}>{error}</p> }
                            <ReassignReportsModal reports={inProgressReports} user={user} offices={offices} handleChange={handleChange} />
                        </>
                        :
                        <p>Are you sure you want to delete this office?</p>
                }
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={handleClose}>Close</Button>
                <Button onClick={() => deleteoffice(data)}>Delete</Button>
            </Modal.Footer>
        </Modal>
    )
}

function ReassignReportsModal({reports, user, offices, handleChange}) {
    const [error, setError] = useState(null);

    return (
        <Table className="reports-table" hover>
            <thead style={{ textAlign: 'center' }}>
                <tr>
                    <th> Report ID </th>
                    <th> Title </th>
                    <th> Reassign to </th>
                </tr>
            </thead>
            <tbody>
                {reports.map((report, index) => {
                    return (
                        <tr key={index} style={{ textAlign: 'center' }}>
                            <td>{report.id}</td>
                            <td>{report.title}</td>
                            <td>
                                <Form.Select onChange={(e) => handleChange(report.id, e.target.value)}>
                                    <option value="">Select new office</option>
                                    {offices.filter(office => office.id !== report.office.id).map((office) => (
                                        <option key={office.id} value={office.id}>{office.name}</option>
                                    ))}
                                </Form.Select>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </Table>
    )
}