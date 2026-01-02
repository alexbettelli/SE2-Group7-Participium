import { Table, Form } from 'react-bootstrap';
import { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/TechnicalOfficersList.css';
import OfficeDropdown from './OfficeDropdown.jsx';
import UserAPI from '../api/UserAPI.mjs';


export default function TechnicalOfficersTable({ officers, offices, updateOfficers}) {

  return (
    <div className="employee-list-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <p className="employee-count" style={{ textAlign: 'center', width: '100%', color: 'var(--color-wine-light)', fontWeight: 600, marginBottom: '1rem' }}>
        Total: {officers.length}
      </p>
      <Table className="employee-list-table" hover style={{ tableLayout: 'fixed', margin: '0 auto' }}>
        <thead>
          <tr style={{ textAlign: 'center' }}>
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
                offices={offices} 
                updateOfficers={updateOfficers}/>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

function TechnicalOfficerRow({ officer, offices, updateOfficers }) {

  const handleAssignment = async (officeId) => {
    await UserAPI.assignOfficerToOffice(officer.id, officeId);
    await updateOfficers();
  }

  const handleRemotion = async (officeId) => {
    await UserAPI.removeOfficerFromOffice(officer.id, officeId);
    await updateOfficers();
  }
  return (
    <tr key={officer.id}>
      <td>{officer.username}</td>
      <td>{officer.firstName}</td>
      <td>{officer.lastName}</td>
      <td>{officer.email}</td>
      <td> <OfficeDropdown offices={offices} selectedOffices={officer.offices?.map(o => o.id)} onSelect={handleAssignment} onDeselect={handleRemotion} /></td>
    </tr>
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
}; 

