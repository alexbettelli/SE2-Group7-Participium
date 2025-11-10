import { useEffect, useState } from "react";
import API from "../api/API.mjs";
import NewEmployeeForm from './NewEmployeeForm.jsx';
import UnassignedEmployeeList from './EmployeeList.jsx';

export default function AdminPage() {
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
      <>
          <h1>Admin Page</h1>
          <p>Welcome, Admin! Here you can manage the system.</p>
          <section className="my-4">
              <h2>Crea nuovo utente</h2>
              <NewEmployeeForm onSuccess={() => updateEmployeeList()} />
          </section>
          <UnassignedEmployeeList employees={employees} roles={roles} offices={offices} onAssign={assignEmployeeToOffice}/>
      </>
  );
}