import { useState, useEffect } from 'react';
import API from '../api/API.mjs';
import ReportsTable from './ReportsTable.jsx';
import '../styles/TechnicalOfficeStaffMember.css';

export default function TechnicalOfficeStaffMemberPage(props) {
    const [reports, setReports] = useState([]);


    useEffect(() => {
        async function getAssignedReports() {
            API.getAssignedReports().then(reports => {
                setReports(reports);
                console.log('Assigned Reports:', reports);
            }).catch(error => {
                console.error('Error fetching assigned reports:', error);
            });
        }
        
        getAssignedReports();
    }, []);

    return (
        <div className="office-member-container">
            <h1>Welcome, <span id='fullname'>{props.user.firstName} {props.user.lastName}!</span></h1>
            <h6>This is your dashboard where you can manage your assigned reports.</h6>
            <ReportsTable reports={reports} user={props.user} setSelectedReport={props.setSelectedReport} />
        </div>
    )
}