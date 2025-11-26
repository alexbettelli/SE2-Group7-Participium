import { useEffect, useState } from "react";
import API from '../api/API.mjs';
import ReportOverview from './ReportOverview.jsx';
import ReportPreview from "./ReportPreview.jsx";
import '../styles/MyReportsPage.css';
import ReportsTable from "./ReportsTable.jsx";

export default function MyReportsPage(props){
    const { user, setSelectedReport } = props;
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await API.getMyReports();
                setReports(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    return (
        <div className="my-reports-page-container">
            <h1>Welcome, <span id='fullname'>{props.user.firstName} {props.user.lastName}!</span></h1>
            <h6>This is the dashboard where you can see and manage your reports.</h6>
            { loading && <p>Loading reports...</p> }
            { error && <p style={{color:'red'}}>Error: {error}</p> }
            { reports.length === 0 && !loading && <p>No reports found.</p> }
            <ReportsTable
                user={user}
                reports={[...reports].sort((a, b) => (b.unreadNotifications || 0) - (a.unreadNotifications || 0))}
                setSelectedReport={setSelectedReport}
            />
        </div>
    );
}