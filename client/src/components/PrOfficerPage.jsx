import API from '../api/API.mjs';
import { useState, useEffect, use } from 'react';
import UnassignedReportsList from './UnassignedReportList.jsx';
import '../styles/AdminPage.css';

export default function PrOfficerPage({user}) {
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offices, setOffices] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await API.getUnassignedReports();
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const data = await API.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    const fetchOffices = async () => {
      try {
        const data = await API.getOffices();
        setOffices(data);
      } catch (error) {
        console.error('Error fetching offices:', error);
      }
    };

    fetchCategories();
    fetchOffices();
    fetchReports();
  }, []);

  const assignReportToOfficer = async (reportId, userId, categoryId, officeId, officerId) => {
    try {
      await API.assignReportToOfficer(reportId, userId, categoryId, officeId, officerId);

      const reports = await API.getUnassignedReports();
      setReports(reports);
    } catch (error) {
      console.error('Error assigning report to officer:', error);
    }
  };

  const rejectReport = async (reportId, userId, reason) => {
    try {
      await API.rejectReport(reportId, userId, reason);
      const reports = await API.getUnassignedReports();
      setReports(reports);
    } catch (error) {
      console.error('Error rejecting report:', error);
    }
  };


  return (
    <>
      <div className="admin-page-container">
        <h2 className="admin-page-title">Public Relations Officer Page</h2>
        <p className="admin-page-description">Welcome {user.username}! Here you can accept, reject and assign reports.</p>
        <hr className="admin-page-divider" />
        <section className="admin-page-section">
          <UnassignedReportsList 
            reports={reports} 
            categories={categories} 
            offices={offices}  
            handleAssign = {assignReportToOfficer}
            handleReject = {rejectReport}/>
        </section>
      </div>
    </>
  );
}

