import ReportPreview from './ReportPreview.jsx';

export default function ReportsTable(props) {
    return (
        <>
            {props.reports.length === 0 ?
                <p>There are no reports at the moment.</p> :
                <div className="reports-table">
                    {props.reports.map(report => {
                        return <ReportRow
                            key={report.id}
                            report={report}
                            externalOffices={props.externalOffices.filter(office => office.category.id === report.category.id)}
                            user={props.user}
                            setSelectedReport={props.setSelectedReport}
                            updateReports={props.updateReports}
                            isExternalMaintainer={props.isExternalMaintainer}
                            showAcceptButton={props.showAcceptButton}
                            onAcceptReport={props.onAcceptReport}
                        />
                    }
                    )}
                </div>
            }
        </>
    )
}

function ReportRow(props) {
    const { report, externalOffices, setSelectedReport, updateReports } = props;

    return (
        <div className='reports-table-row'>
            <ReportPreview
                key={report.id}
                report={report}
                externalOffices={externalOffices}
                user={props.user}
                setSelectedReport={setSelectedReport}
                updateReports={updateReports}
                isExternalMaintainer={props.isExternalMaintainer}
                showAcceptButton={props.showAcceptButton}
                onAcceptReport={props.onAcceptReport}
            />
        </div>
    )
}