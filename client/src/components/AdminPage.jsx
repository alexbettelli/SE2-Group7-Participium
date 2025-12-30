import '../styles/AdminPage.css';
import { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import OfficesTable from './OfficesTable.jsx';
import { Table } from 'react-bootstrap';
import NewEmployeeForm from './NewEmployeeForm.jsx';
import UnassignedEmployeeList from './EmployeeList.jsx';

import UserAPI from '../api/UserAPI.mjs';
import GenericAPI from '../api/GenericAPI.mjs';

export default function AdminPage({ user }) {
  const [employees, setEmployees] = useState([]);
  const [technicalOfficers, setTechnicalOfficers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [retrieve, setRetrieve] = useState(true);
  const [externalOffices, setExternalOffices] = useState([]);
  const [roles, setRoles] = useState([]);
  const [activeTab, setActiveTab] = useState('unassigned');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const unassignedEmployees = await UserAPI.getUnassignedEmployees();
        setEmployees(unassignedEmployees);
      } catch (error) {
        console.error("Error fetching unassigned employees:", error);
      }
    };

    const fetchTechnicalOfficers = async () => {
      try {
        const officers = await UserAPI.getTechnicalOfficers();
        setTechnicalOfficers(officers);
      } catch (error) {
        console.error("Error fetching technical officers:", error);
      }
    };

    const fetchRoles = async () => {
      try {
        const roles = await GenericAPI.getRoles();
        setRoles(roles);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };



    const fetchOffices = async () => {
      try {
        const offices = await GenericAPI.getOffices();
        setOffices(offices);
      } catch (error) {
        console.error("Error fetching offices:", error);
      }
    };

    const fetchExternalOffices = async () => {
      try {
        const externalOffices = await GenericAPI.getExternalOffices();
        setExternalOffices(externalOffices);
      } catch (error) {
        console.error("Error fetching external offices:", error);
      }
    };

    if(retrieve) {
      fetchEmployees();
      fetchTechnicalOfficers();
      fetchRoles();
      fetchOffices();
      fetchExternalOffices();
      setRetrieve(false);
    }
  }, [retrieve]);

  const updateEmployeeList = async () => {
    try {
      const unassignedEmployees = await UserAPI.getUnassignedEmployees();
      setEmployees(unassignedEmployees);
      const officers = await UserAPI.getTechnicalOfficers();
      setTechnicalOfficers(officers);
    } catch (error) {
      console.error("Error updating employee list:", error);
    }
  };

  const assignEmployeeToOffice = async (employeeId, officeId, roleId) => {
    try {
      await UserAPI.assignEmployeeToOffice(employeeId, officeId, roleId);
      updateEmployeeList();
    } catch (error) {
      console.error("Error assigning employee to office:", error);
    }
  };



  return (
    <div className="admin-page-container">
      <h2 className="admin-page-title">Admin Page</h2>
      <p className="admin-page-description">Welcome {user.username}! Here you can manage users and assignments.</p>
      <hr className="admin-page-divider" />
      
      <section className="admin-page-section">
        <NewEmployeeForm onSuccess={() => updateEmployeeList()} />
      </section>
      
      <section className="admin-page-section">
        <div className="admin-tabs">
          <button 
            className={`admin-tab-button ${activeTab === 'unassigned' ? 'active' : ''}`}
            onClick={() => setActiveTab('unassigned')}
          >
            Unassigned Employees ({employees.length})
          </button>
          <button 
            className={`admin-tab-button ${activeTab === 'technical' ? 'active' : ''}`}
            onClick={() => setActiveTab('technical')}
          >
            Technical Officers ({technicalOfficers.length})
          </button>
          <button 
            className={`admin-tab-button ${activeTab === 'offices' ? 'active' : ''}`}
            onClick={() => setActiveTab('offices')}
          >
            Offices ({offices.length})
          </button>
        </div>
        
        <div className="admin-tab-content">
          {activeTab === 'unassigned' && (
            <UnassignedEmployeeList employees={employees} roles={roles} offices={offices} externalOffices={externalOffices} onAssign={assignEmployeeToOffice} />
          )}
          
          {activeTab === 'technical' && (
            <TechnicalOfficersTable officers={technicalOfficers} />
          )}

          {activeTab === 'offices' && (
            <OfficesTable offices={offices} user={user} retrieve={() => setRetrieve(true) } />
          )}
        </div>
      </section>
    </div>
  );
}

function TechnicalOfficersTable({ officers }) {
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
            <th>Assigned Office</th>
          </tr>
        </thead>
        <tbody>
          {officers.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-wine-light)' }}>
                No technical officers assigned yet.
              </td>
            </tr>
          ) : (
            officers.map((officer) => (
              <tr key={officer.id}>
                <td>{officer.username}</td>
                <td>{officer.firstName}</td>
                <td>{officer.lastName}</td>
                <td>{officer.email}</td>
                <td>{officer.officeName}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

AdminPage.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }).isRequired,
};

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
