import { Table, Form, Button, Carousel } from 'react-bootstrap';
import { useEffect, useState} from 'react';
import dayjs from 'dayjs';
import Map from './Map.jsx';



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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2 style={{ textAlign: 'center', width: '100%' }}>New Reports: {reports.length === 0 ? " - None" : ` - ${reports.length}`}</h2>
      <Table hover style={{ tableLayout: 'fixed', margin: '0 auto' }}>
        <thead>
          <tr style={{ textAlign: 'center' }}>
            <th> Title </th>
            <th> Category </th>
            <th> Office </th>
            <th> Officer </th>
            <th> Accept </th>
            <th> Reject </th>
            {reports.length !== 0 && <th></th>}
          </tr>
        </thead>
        <tbody>
          {reports?.map((r) =>
            <ReportRow 
              key={r.id} 
              report={r} 
              categories= {categories || []} 
              offices={offices || []} 
              onClick={() => onClick(r)} 
              handleAssign={handleAssign}
              setReportToReject={setReportToReject} />
          )}
        </tbody>
      </Table>
      {selectedReport && <ReportView report={selectedReport} onClose={closeReportView}  />}
      {reportToReject && <RejectReportModal report={reportToReject} onClose={closeRejectModal} handleReject={handleReject}/>}
      
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

      <td>
        <Button onClick={(e) => { 
          e.stopPropagation(); 
          if(selectedOfficer && selectedOffice && selectedCategory)
            handleAssign(report.id, report.user.id, selectedCategory, selectedOffice, selectedOfficer);
          else
            alert('Please select an officer to assign the report to.'); 
          }}>Accept</Button>
      </td>
      <td>
        <Button onClick={(e) => { 
          e.stopPropagation();
          setReportToReject(report);
        }}>Reject</Button>
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
                    <button className="close-button" onClick={props.onClose}><i className="bi bi-x-lg"></i></button>
                </div>
                <div className="report-view-content">
                    <div className="wrapper">
                        <Carousel>
                            { props.report.images.map((image, index) => {
                                return <Carousel.Item key={index}><img className="d-block" src={image.imageUrl} alt={`Image ${index+1}`} /></Carousel.Item>;
                            }) }
                        </Carousel>
                        <Map lat={report.latitude} lng={report.longitude} />
                    </div>
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
                        <div className="field" style={{ "gridColumn": "span 2" }}>
                            <h3>Description</h3>
                            <p>{report.description}</p>
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
            <div
                className="reject-modal"
                style={{
                    width: '400px',
                    background: '#fff',
                    borderRadius: '10px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
                    padding: '2rem',
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000
                }}
            >
                <h3>Reason for rejection:</h3>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={4}
                    style={{ width: '100%', marginBottom: '1.5rem', resize: 'vertical', borderRadius: '6px', border: '1px solid #ccc', padding: '0.5rem' }}
                    placeholder="Write the reason here..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="danger" onClick={handleRejectClick} disabled={!reason.trim()}>Reject</Button>
                </div>
            </div>
        </>
    );
}