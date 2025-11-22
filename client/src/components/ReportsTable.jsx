import ReportPreview from './ReportPreview.jsx';

export default function ReportsTable(props) {
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