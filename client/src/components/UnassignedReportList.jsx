import { Table, Form, Button, Carousel } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import MapComponent from './Map.jsx';
import '../styles/UnassignedReportList.css';
import PropTypes from 'prop-types';

export default function UnassignedReportsList(props) {
  const { reports, categories, offices, handleAssign, handleReject } = props;
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportToReject, setReportToReject] = useState(null);

  const onClick = (report) => {
    setSelectedReport(report);
  };

  const closeReportView = () => {
    setSelectedReport(null);
  };

  const closeRejectModal = () => {
    setReportToReject(null);
  };

  return (
    <div className="unassigned-reports-container">
      <h2 className="unassigned-report-list-title">New Reports: {reports.length === 0 ? " None" : ` ${reports.length}`}</h2>
      <p className="unassigned-report-list-subtitle">Click on a report to display the details.</p>
      <Table hover className="unassigned-reports-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Office</th>
            <th>Officer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports?.map((r) =>
            <ReportRow
              key={r.id}
              report={r}
              categories={categories || []}
              offices={offices || []}
              onClick={() => onClick(r)}
              handleAssign={handleAssign}
              setReportToReject={setReportToReject} />
          )}
        </tbody>
      </Table>
      {selectedReport && <ReportView report={selectedReport} onClose={closeReportView} />}
      {reportToReject && <RejectReportModal report={reportToReject} onClose={closeRejectModal} handleReject={handleReject} />}
    </div>
  );
};

const ReportRow = (props) => {
  const { report, categories, offices, onClick, handleAssign, setReportToReject } = props;
  const initialCatId = report?.category?.id ?? '';

  const [selectedCategory, setSelectedCategory] = useState(String(initialCatId));
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [officers, setOfficers] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState(() => {
    const first = offices.find(o => String(o.category?.id) === String(initialCatId));
    return first?.id ?? 'no offices';
  });

  useEffect(() => {
    const catId = String(selectedCategory);
    const filteredOffice = offices.find(o => String(o.category?.id) === catId);
    setSelectedOffice(filteredOffice?.id ?? 'no offices');
    setOfficers(filteredOffice?.employees ?? []);
    setSelectedOfficer('');
  }, [selectedCategory, offices]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleAccept = () => {
    if (selectedOfficer && selectedOffice && selectedCategory) {
      handleAssign(report.id, report.user.id, selectedCategory, selectedOffice, selectedOfficer);
    } else {
      alert('Please select an officer to assign the report to.');
    }
  };

  return (
    <tr onClick={onClick} style={{ cursor: 'pointer' }}>
      <td>{report.title}</td>

      <td>
        <Form.Select
          size="sm"
          value={selectedCategory}
          onChange={handleCategoryChange}
          onClick={(e) => e.stopPropagation()}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>{cat.categoryName}</option>
          ))}
        </Form.Select>
      </td>

      <td>{offices.find(o => o.id === selectedOffice)?.name || 'no offices'}</td>

      <td>
        <Form.Select
          size="sm"
          value={selectedOfficer || ''}
          onChange={(e) => setSelectedOfficer(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="">choose officer</option>
          {officers.length > 0 ? officers.map((officer) => (
            <option key={officer.id} value={officer.id}>{officer.firstName} {officer.lastName} ({officer.username})</option>
          )) : <option disabled>No officers available</option>}
        </Form.Select>
      </td>

      <td className="actions-cell">
        <button className="btn-accept-report" onClick={(e) => {
          e.stopPropagation();
          handleAccept();
        }}>
          <i className="bi bi-check-circle-fill"></i>{' '}Accept
        </button>
        <button className="btn-reject-report" onClick={(e) => {
          e.stopPropagation();
          setReportToReject(report);
        }}>
          <i className="bi bi-x-circle-fill"></i>{' '}Reject
        </button>
      </td>
    </tr>
  );
};

function ReportView(props) {
  const report = props.report;

  return (
    <>
      <div id="backdrop" onClick={props.onClose}></div>
      <div className="report-view">
        <div className="report-view-header">
          <h2>{props.report.title}</h2>
          <button className="close-button" onClick={props.onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="report-view-content">
          <div className="media-container">
            <div className="carousel-wrapper">
              <Carousel>
                {props.report.images.map((image) => {
                  return (
                    <Carousel.Item key={image.id ?? image.imageUrl}>
                      <img className="d-block w-100" src={image.imageUrl} alt={`Img ${image.id ?? image.imageUrl}`} />
                    </Carousel.Item>
                  );
                })}
              </Carousel>
            </div>
            <div className="map-container-popup">
              <MapComponent lat={report.latitude} lng={report.longitude} />
            </div>
          </div>
          <div className="report-details">
            <div className="fields">
              <div className="field user-field">
                <h3>Reported by</h3>
                <p><strong>Username: </strong>{report.user.username}</p>
              </div>
              <div className="field">
                <h3>Reported on</h3>
                <p><strong>Creation: </strong>{dayjs(report.createdAt).format('DD/MM/YYYY HH:mm')}</p>
              </div>
              <div className="field">
                <h3>Address</h3>
                <p>{report.address.split("Piemonte")[0].split("Turin")[0].trimEnd().replace(/,$/, "")}</p>
              </div>
              <div className="field">
                <h3>Original Category</h3>
                <p><strong>Report ID: </strong>{report.id}</p>
                <p><strong>Category: </strong>{report.category.categoryName}</p>
              </div>
              <div className="field description-field">
                <h3>Description</h3>
                <p>{report.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function RejectReportModal(props) {
  const { report, onClose, handleReject } = props;
  const [reason, setReason] = useState('');

  const handleRejectClick = async () => {
    await handleReject(report.id, report.user.id, reason);
    onClose();
  };

  return (
    <>
      <div className="rp-backdrop" onClick={onClose}></div>
      <div className="reject-modal">
        <h3>Reason for rejection:</h3>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          placeholder="Write the reason here..."
        />
        <div>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={handleRejectClick} disabled={!reason.trim()}>Reject</Button>
        </div>
      </div>
    </>
  );
}

const ImageShape = PropTypes.shape({
  id: PropTypes.number,
  imageUrl: PropTypes.string.isRequired,
});

const CategoryShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  categoryName: PropTypes.string,
});

const UserShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  username: PropTypes.string,
});

const EmployeeShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  username: PropTypes.string,
});

const OfficeShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  name: PropTypes.string,
  category: CategoryShape,
  employees: PropTypes.arrayOf(EmployeeShape),
});


const ReportShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  address: PropTypes.string,
  images: PropTypes.arrayOf(ImageShape).isRequired,
  user: UserShape.isRequired,
  category: CategoryShape.isRequired,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]), // ✅
});

UnassignedReportsList.propTypes = {
  reports: PropTypes.arrayOf(ReportShape).isRequired,
  categories: PropTypes.arrayOf(CategoryShape),
  offices: PropTypes.arrayOf(OfficeShape),
  handleAssign: PropTypes.func.isRequired,
  handleReject: PropTypes.func.isRequired,
};

UnassignedReportsList.defaultProps = {
  categories: [],
  offices: [],
};

ReportRow.propTypes = {
  report: ReportShape.isRequired,
  categories: PropTypes.arrayOf(CategoryShape).isRequired,
  offices: PropTypes.arrayOf(OfficeShape).isRequired,
  onClick: PropTypes.func.isRequired,
  handleAssign: PropTypes.func.isRequired,
  setReportToReject: PropTypes.func.isRequired,
};

ReportView.propTypes = {
  report: ReportShape.isRequired,
  onClose: PropTypes.func.isRequired,
};

RejectReportModal.propTypes = {
  report: ReportShape.isRequired,
  onClose: PropTypes.func.isRequired,
  handleReject: PropTypes.func.isRequired,
};