import { useState, useEffect } from 'react';
import UserAPI from '../api/UserAPI.mjs';
import ReportsTable from './ReportsTable.jsx';
import '../styles/commonStyle.css';

export default function ExternalMaintainerPage(props) {
    const [reports, setReports] = useState([]);
    const [retrieve, setRetrieve] = useState(true);

    const updateReports = () => {
        setRetrieve(true);
    }

    useEffect(() => {
        async function getAssignedReports() {
            try {
                const reports = await UserAPI.getExternalMaintainerReports();
                setReports(reports);
            } catch (error) {
                console.error('Error fetching assigned reports:', error);
            }
        }

        if (retrieve) {
            getAssignedReports();
            setRetrieve(false);
        }
    }, [retrieve]);

    return (
        <div className="external-maintainer-container">
            <h1>Welcome, <span id='fullname'>{props.user.firstName} {props.user.lastName}!</span></h1>
            <h6>This is the dashboard where you can manage your assigned reports.</h6>
            <ReportsTable
                user={props.user}
                reports={[...reports].sort((a, b) => (b.unreadNotifications || 0) - (a.unreadNotifications || 0))}
                setSelectedReport={props.setSelectedReport}
                updateReports={updateReports}
            />
        </div>
    )
}