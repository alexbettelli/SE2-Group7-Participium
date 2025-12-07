import { useState, useEffect } from 'react';
import ReportAPI from '../api/ReportAPI.mjs';
import GenericAPI from '../api/GenericAPI.mjs';
import ReportsTable from './ReportsTable.jsx';
import '../styles/TechnicalOfficeStaffMember.css';

export default function TechnicalOfficeStaffMemberPage(props) {
    const [reports, setReports] = useState([]);
    const [externalOffices, setExternalOffices] = useState([]);
    const [retrieve, setRetrieve] = useState(true);

    const updateReports = () => {
        setRetrieve(true);
    }

    useEffect(() => {
        async function fetchExternalOffices() {
            GenericAPI.getExternalOffices().then(externalOffices => {
                setExternalOffices(externalOffices);
            }).catch(error => {
                console.error('Error fetching external offices:', error);
            });
        }
        fetchExternalOffices();
    }, []);

    useEffect(() => {
        async function getAssignedReports() {
            ReportAPI.getAssignedReports().then(reports => {
                setReports(reports);
            }).catch(error => {
                console.error('Error fetching assigned reports:', error);
            });
        }

        if (retrieve) {
            getAssignedReports();
            setRetrieve(false);
        }
    }, [retrieve]);

    return (
        <div className="office-member-container">
            <h1>Welcome, <span id='fullname'>{props.user.firstName} {props.user.lastName}!</span></h1>
            <h6>This is the dashboard where you can manage your assigned reports.</h6>
            <ReportsTable
                user={props.user}
                reports={[...reports].sort((a, b) => (b.unreadNotifications || 0) - (a.unreadNotifications || 0))}
                externalOffices={externalOffices}
                setSelectedReport={props.setSelectedReport}
                updateReports={updateReports}
            />
        </div>
    )
}