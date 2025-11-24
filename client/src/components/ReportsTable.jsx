import ReportPreview from './ReportPreview.jsx';

export default function ReportsTable(props) {

    return (
        <>
            { props.reports.length === 0 ?
                <p>There are no reports at the moment.</p> :
                <div className="reports-table">
                    { props.reports.map(report => <ReportRow key={report.id} report={report} user={props.user} setSelectedReport={props.setSelectedReport} /> )}    
                </div>
            }
        </>
    )
}

function ReportRow(props) {
    const { report, setSelectedReport } = props;

    return (
        <div className='reports-table-row'>
            <ReportPreview key={report.id} report={report} user={props.user} setSelectedReport={setSelectedReport} />
        </div>
    )
}