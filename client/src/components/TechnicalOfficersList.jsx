import { Table, Form, Modal, Button } from 'react-bootstrap';
import { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/TechnicalOfficersList.css';
import OfficeDropdown from './OfficeDropdown.jsx';
import UserAPI from '../api/UserAPI.mjs';
import ReportAPI from '../api/ReportAPI.mjs';


export default function TechnicalOfficersTable({ officers, offices, updateOfficers}) {

  return (
    <div className="employee-list-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <p className="employee-count" style={{ textAlign: 'center', width: '100%', color: 'var(--color-wine-light)', fontWeight: 600, marginBottom: '1rem' }}>
        Total: {officers.length}
      </p>
      <Table className="employee-list-table" hover style={{ tableLayout: 'fixed', margin: '0 auto' }}>
        <thead>
          <tr style={{ textAlign: 'center', verticalAlign: 'middle' }}>
            <th>Username</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Assigned Offices</th>
          </tr>
        </thead>
        <tbody>
          {officers?.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-wine-light)' }}>
                No technical officers assigned yet.
              </td>
            </tr>
          ) : (
            officers.map((officer) => (
              < TechnicalOfficerRow key={officer.id} 
                officer={officer} 
                allOfficers={officers}
                offices={offices} 
                updateOfficers={updateOfficers}/>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

function TechnicalOfficerRow({ officer, allOfficers, offices, updateOfficers }) {
  const [reportsToReassign, setReportsToReassign] = useState({});
  const [reassignmentMap, setReassignmentMap] = useState({});

  const handleAssignment = async (officeId) => {
    await UserAPI.assignOfficerToOffice(officer.id, officeId);
    await updateOfficers();
  }

  const handleRemotion = async (officeId) => {
    const reports = await ReportAPI.getReportsByOfficerInOffice(officer.id, officeId);
    if (reports.length > 0) {
      setReportsToReassign(prev => ({
        ...prev,
        [officeId]: reports
      }));
    }
    else {
      await UserAPI.removeOfficerFromOffice(officer.id, officeId);
      await updateOfficers();
    }
  }

  const currentOfficeId = Object.keys(reportsToReassign)[0];
  const currentOfficeToRemove = currentOfficeId ? offices.find(o => o.id == currentOfficeId) : null;
  const currentReportsToReassign = currentOfficeId ? reportsToReassign[currentOfficeId] : [];
  const showModal = !!currentOfficeId;

  const availableOfficers = currentOfficeId ? allOfficers.filter(o => 
    o.id !== officer.id && 
    o.offices?.some(off => off.id == currentOfficeId)
  ) : [];

  const handleReassignmentChange = (reportId, value) => {
    setReassignmentMap(prev => ({
      ...prev,
      [reportId]: value
    }));
  };

  const isReassignmentComplete = !currentReportsToReassign || currentReportsToReassign.every(report => reassignmentMap[report.id]);

  const confirmRemotion = async () => {
    if (currentReportsToReassign && currentOfficeToRemove) {
      for (const report of currentReportsToReassign) {
        const targetOfficerId = reassignmentMap[report.id];
        if (!targetOfficerId) return;
        await ReportAPI.reassignReportToOfficer(report.id, targetOfficerId);
      }
      await UserAPI.removeOfficerFromOffice(officer.id, currentOfficeToRemove.id);
      await updateOfficers();
      
      setReportsToReassign(prev => {
        const next = { ...prev };
        delete next[currentOfficeId];
        return next;
      });
      setReassignmentMap({});
    }
  }

  const cancelRemotion = () => {
    setReportsToReassign(prev => {
      const next = { ...prev };
      delete next[currentOfficeId];
      return next;
    });
    setReassignmentMap({});
  }
  
  return (
    <>
      <tr key={officer.id} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
        <td>{officer.username}</td>
        <td>{officer.firstName}</td>
        <td>{officer.lastName}</td>
        <td>{officer.email}</td>
        <td> <OfficeDropdown offices={offices} selectedOffices={officer.offices?.map(o => o.id)} onSelect={handleAssignment} onDeselect={handleRemotion} /></td>
      </tr>

      <Modal show={showModal} onHide={cancelRemotion} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Confirm Removal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to remove <strong>{officer.firstName} {officer.lastName}</strong> from <strong>{currentOfficeToRemove?.name}</strong>?</p>
          {currentReportsToReassign && (
            <>
              <p>This officer has the following reports assigned in this office. Please reassign them:</p>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Reassign To</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReportsToReassign.map(report => (
                    <tr key={report.id}>
                      <td>{report.description}</td>
                      <td>{report.category.categoryName}</td>
                      <td>
                        <Form.Select 
                          size="sm"
                          value={reassignmentMap[report.id] || ""}
                          onChange={(e) => handleReassignmentChange(report.id, e.target.value)}
                          isInvalid={!reassignmentMap[report.id]}
                        >
                          <option value="">-- Select Officer --</option>
                          {availableOfficers.map(ao => (
                            <option key={ao.id} value={ao.id}>
                              {ao.firstName} {ao.lastName} ({ao.username})
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelRemotion}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmRemotion} disabled={!isReassignmentComplete}>
            Confirm Removal & Reassign
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}



TechnicalOfficersTable.propTypes = {
  officers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    officeName: PropTypes.string,
    officeId: PropTypes.number
  })).isRequired
  ,
  offices: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  updateOfficers: PropTypes.func.isRequired
}; 


TechnicalOfficerRow.propTypes = {
  officer: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    offices: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string
    }))
  }).isRequired,
  allOfficers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    offices: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }))
  })).isRequired,
  offices: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  updateOfficers: PropTypes.func.isRequired
};

