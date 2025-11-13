import { useEffect, useState } from "react";
import API from "../api/API.mjs";
import NewEmployeeForm from './NewEmployeeForm.jsx';
import UnassignedEmployeeList from './EmployeeList.jsx';
import '../styles/AdminPage.css';

export default function AdminPage({user}) {
  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const unassignedEmployees = await API.getUnassignedEmployees();
        setEmployees(unassignedEmployees);
      } catch (error) {
        console.error("Error fetching unassigned employees:", error);
      }
    };

    const fetchRoles = async () => {
      try {
        const roles = await API.getRoles();
        setRoles(roles);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    const fetchOffices = async () => {
      try{
        const offices = await API.getOffices();
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
      const unassignedEmployees = await API.getUnassignedEmployees();
      setEmployees(unassignedEmployees);
    } catch (error) {
      console.error("Error updating employee list:", error);
    }
  };

  const assignEmployeeToOffice = async (employeeId, officeId, roleId) => {
    try{
      console.log(`Assigning employee ${employeeId} to role ${roleId}`);
      await API.assignEmployeeToOffice(employeeId, officeId, roleId);
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
        <UnassignedEmployeeList employees={employees} roles={roles} offices={offices} onAssign={assignEmployeeToOffice}/>
      </section>
    </div>
  );
}