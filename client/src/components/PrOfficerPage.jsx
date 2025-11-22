import API from '../api/API.mjs';
import { useState, useEffect } from 'react';
import '../styles/AdminPage.css';
import { Table, Button, Form } from 'react-bootstrap';

export default function PrOfficerPage({user}) {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await API.getUnassignedReports();
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, []);

  const closeDetails = () => setSelectedReport(null);

  return (
    <>
      <div className="admin-page-container">
        <h2 className="admin-page-title">Public Relations Officer Page</h2>
        <p className="admin-page-description">Welcome {user.username}! Here you can accept, reject and assign reports.</p>
        <hr className="admin-page-divider" />
        <section className="admin-page-section">
          <UnassignedReportsList reports={reports} onRowClick={setSelectedReport} />
          {selectedReport && (
            <ReportDetails
              report={selectedReport}
              onClose={closeDetails}
            />
          )}
        </section>
      </div>
    </>
  );
}

const UnassignedReportsList = ({ reports, onRowClick }) => {
  return (
    <div className="employee-list-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2 className="employee-list-title" style={{ textAlign: 'center', width: '100%' }}>New Reports: {reports.length === 0 ? " - None" : ` - ${reports.length}`}</h2>
      <Table hover style={{ tableLayout: 'fixed', margin: '0 auto' }}>
        <thead>
          <tr style={{ textAlign: 'center' }}>
            <th> Title </th>
            <th> Category </th>
            <th> Accept </th>
            <th> Edit </th>
            <th> Reject </th>
            {reports.length !== 0 && <th></th>}
          </tr>
        </thead>
        <tbody>
          {reports?.map((r) =>
            <ReportRow key={r.id} report={r} onClick={() => onRowClick(r)} />
          )}
        </tbody>
      </Table>
    </div>
  );
};

const ReportRow = ({ report, onClick }) => {
  return (
    <tr onClick={onClick} style={{ cursor: 'pointer' }}>
      <td>{report.title}</td>
      <td>{report.category?.categoryName ?? report.catId}</td>
      <td><button onClick={(e) => { e.stopPropagation(); console.log('Accept', report.id); }}>Accept</button></td>
      <td><button onClick={(e) => { e.stopPropagation(); console.log('Edit', report.id); }}>Edit</button></td>
      <td><button onClick={(e) => { e.stopPropagation(); console.log('Reject', report.id); }}>Reject</button></td>
    </tr>
  );
};

const ReportDetails = ({ report, onClose }) => {
  const [form] = useState({
    id: report.id,
    title: report.title ?? '',
    description: report.description ?? '',
    address: report.address ?? '',
    categoryName: report.category?.categoryName ?? '',
    statusName: report.status?.statusName ?? '',
    images: report.images ?? []
  });

  return (
    <div className="report-details" style={{ marginTop: 20, border: '1px solid #ccc', padding: 16, borderRadius: 6, maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Report details</h3>
        <div>
          <Button variant="secondary" size="sm" onClick={onClose} style={{ marginRight: 8 }}>Close</Button>
        </div>
      </div>

      <Form style={{ marginTop: 12 }}>
        <Form.Group className="mb-2">
          <Form.Label>Title</Form.Label>
          <Form.Control readOnly value={form.title} />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Description</Form.Label>
          <Form.Control as="textarea" rows={4} readOnly value={form.description} />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Address</Form.Label>
          <Form.Control readOnly value={form.address} />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Category</Form.Label>
          <Form.Control readOnly value={form.categoryName} />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Status</Form.Label>
          <Form.Control readOnly value={form.statusName} />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Images</Form.Label>
          <div className="photo-gallery" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {form.images && form.images.length > 0 ? form.images.map( img => (
                  <div key={img.id} className="photo-item" style={{ width: 120, height: 80, overflow: 'hidden' }}>
                      <img 
                          src={img.imageUrl} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'; }}
                      />
                  </div>
              )) : <div>No images</div>}
          </div>
        </Form.Group>
      </Form>
    </div>
  );
  
};