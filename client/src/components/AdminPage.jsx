import '../styles/AdminPage.css';
import { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import NewEmployeeForm from './NewEmployeeForm.jsx';
import UnassignedEmployeeList from './EmployeeList.jsx';
import TechnicalOfficersTable from './TechnicalOfficersList.jsx';

import UserAPI from '../api/UserAPI.mjs';
import GenericAPI from '../api/GenericAPI.mjs';

export default function AdminPage({ user }) {
  const [employees, setEmployees] = useState([]);
  const [technicalOfficers, setTechnicalOfficers] = useState([]);
  const [offices, setOffices] = useState([]);
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
        officers.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
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

    fetchEmployees();
    fetchTechnicalOfficers();
    fetchRoles();
    fetchOffices();
    fetchExternalOffices();
  }, []);

  const updateEmployeeList = async () => {
    try {
      const unassignedEmployees = await UserAPI.getUnassignedEmployees();
      setEmployees(unassignedEmployees);
      const officers = await UserAPI.getTechnicalOfficers();
      officers.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
      setTechnicalOfficers(officers);
    } catch (error) {
      console.error("Error updating employee list:", error);
    }
  };

  const updateTechnicalOfficers = async () => {
    try {
      const officers = await UserAPI.getTechnicalOfficers();
      officers.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
      setTechnicalOfficers(officers);
    } catch (error) {
      console.error("Error updating technical officers list:", error);
    }
  };

  const assignEmployeeToOffice = async (employeeId, officesId, roleId) => {
    try {
      await UserAPI.assignEmployeeToOffice(employeeId, officesId[0], roleId);
      for (let i = 1; i < officesId.length; i++) {
        await UserAPI.assignOfficerToOffice(employeeId, officesId[i]);
      }
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
        </div>
        
        <div className="admin-tab-content">
          {activeTab === 'unassigned' && (
            <UnassignedEmployeeList employees={employees} roles={roles} offices={offices} externalOffices={externalOffices} onAssign={assignEmployeeToOffice} />
          )}
          
          {activeTab === 'technical' && (
            <TechnicalOfficersTable officers={technicalOfficers} offices={offices} updateOfficers={updateTechnicalOfficers} />
          )}
        </div>
      </section>
    </div>
  );
}



AdminPage.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }).isRequired,
};