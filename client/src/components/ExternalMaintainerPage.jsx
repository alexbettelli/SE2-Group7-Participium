import { useState, useEffect } from 'react';
import ReportAPI from '../api/ReportAPI.mjs';
import ReportsTable from './ReportsTable.jsx';
import '../styles/ExternalMaintainerPage.css';

export default function ExternalMaintainerPage(props) {
    const [assignedReports, setAssignedReports] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [retrieve, setRetrieve] = useState(true);

    const updateReports = () => {
        setRetrieve(true);
    }

    useEffect(() => {
        async function fetchReports() {
            try {
                const [assigned, my] = await Promise.all([
                    ReportAPI.getExternalOfficeAssignedReports(),
                    ReportAPI.getExternalMaintainerMyReports()
                ]);
                setAssignedReports(assigned);
                setMyReports(my);
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        }

        if (retrieve) {
            fetchReports();
            setRetrieve(false);
        }
    }, [retrieve]);

    const handleAcceptReport = async (reportId) => {
        try {
            await ReportAPI.updateExternalMaintainerReportStatus(reportId, 3);
            updateReports();
        } catch (error) {
            console.error('Error accepting report:', error);
            alert('Failed to accept report: ' + error.message);
        }
    };

    return (
        <div className="external-maintainer-page">
            <h1>Welcome, <span id='fullname'>{props.user.firstName} {props.user.lastName}!</span></h1>
            <h6>This is the dashboard where you can manage reports assigned to your company.</h6>
            
            <div className="two-columns">
                <div className="column">
                    <h2><i className="bi bi-clipboard-check"></i> Reports to Accept ({assignedReports.length})</h2>
                    <ReportsTable
                        user={props.user}
                        reports={assignedReports}
                        setSelectedReport={props.setSelectedReport}
                        updateReports={updateReports}
                        isExternalMaintainer={true}
                        showAcceptButton={true}
                        onAcceptReport={handleAcceptReport}
                    />
                </div>
                
                <div className="column">
                    <h2><i className="bi bi-tools"></i> My Reports ({myReports.length})</h2>
                    <ReportsTable
                        user={props.user}
                        reports={myReports.sort((a, b) => (b.unreadNotifications || 0) - (a.unreadNotifications || 0))}
                        setSelectedReport={props.setSelectedReport}
                        updateReports={updateReports}
                        isExternalMaintainer={true}
                    />
                </div>
            </div>
        </div>
    );
}