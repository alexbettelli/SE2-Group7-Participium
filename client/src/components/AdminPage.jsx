import { useEffect, useState } from "react";
import API from "../api/API.mjs";
import NewEmployeeForm from './NewEmployeeForm.jsx';
import UnassignedEmployeeList from './EmployeeList.jsx';

export default function AdminPage() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const unassignedEmployees = await API.getUnassignedEmployees();
        setEmployees(unassignedEmployees);
      } catch (error) {
        console.error("Error fetching unassigned employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  const updateEmployeeList = async () => {
    try {
      const unassignedEmployees = await API.getUnassignedEmployees();
      setEmployees(unassignedEmployees);
    } catch (error) {
      console.error("Error updating employee list:", error);
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
          <UnassignedEmployeeList employees={employees} />
      </>
  );
}