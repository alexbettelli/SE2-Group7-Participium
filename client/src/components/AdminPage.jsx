import '../styles/AdminPage.css';
import { useEffect, useState } from "react";
import PropTypes from 'prop-types';

import NewEmployeeForm from './NewEmployeeForm.jsx';
import UnassignedEmployeeList from './EmployeeList.jsx';

import UserAPI from '../api/UserAPI.mjs';
import GenericAPI from '../api/GenericAPI.mjs';

export default function AdminPage({ user }) {
  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const unassignedEmployees = await UserAPI.getUnassignedEmployees();
        setEmployees(unassignedEmployees);
      } catch (error) {
        console.error("Error fetching unassigned employees:", error);
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

    fetchEmployees();
    fetchRoles();
    fetchOffices();
  }, []);

  const updateEmployeeList = async () => {
    try {
      const unassignedEmployees = await UserAPI.getUnassignedEmployees();
      setEmployees(unassignedEmployees);
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
        <UnassignedEmployeeList employees={employees} roles={roles} offices={offices} onAssign={assignEmployeeToOffice} />
      </section>
    </div>
  );
}

AdminPage.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }).isRequired,
}; 
