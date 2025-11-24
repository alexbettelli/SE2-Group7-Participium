import { Table, Form, Button } from 'react-bootstrap';
import { useEffect, useState} from 'react';



export default function UnassignedReportsList(props) {
  const { reports, categories, offices, onClick } = props;
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
              onClick={() => onClick(r)} />
          )}
        </tbody>
      </Table>
    </div>
  );
};

const ReportRow = (props) => {
  const { report, categories, offices, onClick } = props;
  const [selectedCategory, setSelectedCategory] = useState(report.category.id);
  const [selectedOffice, setSelectedOffice] = useState(offices.filter(o => o.category.id === report.category.id)[0]?.id || 'no offices');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    const filteredOffice = offices.filter(o => o.category.id == selectedCategory);
    setSelectedOffice(filteredOffice[0]?.id || 'no offices');
    setOfficers(filteredOffice[0]?.employees || []);

  } , [selectedCategory]);


  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
  };

  return (
    <tr onClick={onClick} style={{ cursor: 'pointer' }}>
      <td>{report.title}</td>
      
      <td >
        <Form.Select
          size="sm"
          value={selectedCategory}
          onChange = {handleCategoryChange}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
          ))}
        </Form.Select>
      </td>

      <td> {offices.filter(o => o.id === selectedOffice)[0]?.name || 'no offices'}</td>
      <td>
        <Form.Select
          size="sm"
          value={selectedOfficer? selectedOfficer.name : 'choose officer'}
          onChange={(e) => setSelectedOfficer(e.target.value)}
        >
          {officers?.length > 0 ? officers.map((officer) => (
            <option key={officer.id} value={officer.id}>{officer.firstName} {officer.lastName} ({officer.username})</option>
          )) : <option>No officers available</option>}
        </Form.Select>
      </td>

      <td><button onClick={(e) => { e.stopPropagation(); console.log('Accept', report.id); }}>Accept</button></td>
      <td><button onClick={(e) => { e.stopPropagation(); console.log('Reject', report.id); }}>Reject</button></td>
    </tr>
  );
};

