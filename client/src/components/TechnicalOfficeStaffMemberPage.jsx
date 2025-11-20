import { useState, useEffect } from 'react';
import API from '../api/API.mjs';
import ReportPreview from './ReportPreview.jsx';
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
            <ReportsTable reports={reports} setSelectedReport={props.setSelectedReport} />
        </div>
    )
}

function ReportsTable(props) {
    return (
        <>
            { props.reports.length === 0 ?
                <p>No reports assigned to you.</p> :
                <div className="reports-table">
                    { props.reports.map(report => <ReportRow key={report.id} report={report} setSelectedReport={props.setSelectedReport} /> )}    
                </div>
            }
        </>
    )
}

function ReportRow(props) {
    const { report, setSelectedReport } = props;

    return (
        <div className='reports-table-row'>
            <ReportPreview key={report.id} report={report} setSelectedReport={setSelectedReport} />
        </div>
    )
}