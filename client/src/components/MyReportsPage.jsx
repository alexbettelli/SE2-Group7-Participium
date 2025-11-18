import { useEffect, useState } from "react";
import API from '../api/API.mjs';
import ReportOverview from './ReportOverview.jsx';
import ReportPreview from "./ReportPreview.jsx";
import '../styles/MyReportsPage.css';

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
        <div>
            <h1 className="page-title">My Reports</h1>
            <hr className="title-divider" />

            {loading && <p>Loading reports...</p>}
            {error && <p style={{color:'red'}}>Error: {error}</p>}
            {reports.length === 0 && !loading && <p>No reports found.</p>}
            <div className="reports-grid">
                {reports.map((report) => (
                    <ReportPreview key={report.id} user={user} report={report} setSelectedReport={setSelectedReport}/>
                ))}
            </div>
        </div>
    );
}