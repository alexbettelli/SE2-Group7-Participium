import ReportPreview from './ReportPreview.jsx';
import PropTypes from 'prop-types';

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
                            externalOffices={props.externalOffices?.filter(office => office.category.id === report.category.id)}
                            user={props.user}
                            setSelectedReport={props.setSelectedReport}
                            updateReports={props.updateReports} />
                    }
                    )}
                </div>
            }
        </>
    )
}

ReportsTable.propTypes = {
    reports: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        category: PropTypes.shape({
            id: PropTypes.number
        })
    })).isRequired,
    user: PropTypes.object.isRequired,
    setSelectedReport: PropTypes.func.isRequired,
    updateReports: PropTypes.func,
    externalOffices: PropTypes.arrayOf(PropTypes.shape({
        category: PropTypes.shape({
            id: PropTypes.number
        })
    }))
};

function ReportRow(props) {
    const { report, externalOffices,setSelectedReport, updateReports } = props;

    return (
        <div className='reports-table-row'>
            <ReportPreview key={report.id} report={report} externalOffices={externalOffices} user={props.user} setSelectedReport={setSelectedReport} updateReports={updateReports} />
        </div>
    )
}

ReportRow.propTypes = {
    report: PropTypes.object.isRequired,
    externalOffices: PropTypes.array,
    user: PropTypes.object.isRequired,
    setSelectedReport: PropTypes.func.isRequired,
    updateReports: PropTypes.func
};