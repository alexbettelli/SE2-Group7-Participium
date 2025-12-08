import PropTypes from 'prop-types';

export default function ReportPopup(props) {
  return (

    <div style={{ minWidth: "200px" }}>
      <h5 style={{ margin: "0 0 5px 0" }}>{props.report.title}</h5>
      <p style={{ margin: "0 0 5px 0" }}>
        <strong>{props.report.category?.categoryName || ""}</strong>
      </p>
      <button
        style={{ padding: "5px 10px", cursor: "pointer" }}
        onClick={() => props.handlePopUpDetailsClick(props.report)}
      >
        See details
      </button>
    </div>
  );
}

ReportPopup.propTypes = {
  report: PropTypes.shape({
    title: PropTypes.string.isRequired,
    category: PropTypes.shape({
      categoryName: PropTypes.string
    })
  }).isRequired,
  handlePopUpDetailsClick: PropTypes.func.isRequired
};