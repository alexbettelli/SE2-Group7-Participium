import { useNavigate } from 'react-router-dom';

export default function CitizenPage() {
  const navigate = useNavigate();

  const handleTestReportOverview = () => {
    const mockReport = {
      id: 1,
      title: "Dangerous hole in the road in Via Roma",
      description: "A large hole has formed in the road, posing a risk to vehicles and pedestrians.",
      category: "Roads and Urban Furnishings",
      latitude: 45.0703,
      longitude: 7.6869,
      address: "Via Roma, 10, Turin, Italy",  // ← Aggiungi address
      photos: [],
      isAnonymous: false,
      author: "Mario Rossi",
      status: "Pending Approval",
      createdAt: new Date().toISOString()
    };
    
    navigate('/report-overview', { state: { report: mockReport } }); //pass here report data
  }; 

  return (
    <>
      <h1>HELLO, YOU ARE IN THE CITIZEN HOME PAGE</h1>
      <button onClick={handleTestReportOverview}>
        Go to Report Overview (Test)
      </button>
    </>
  );
}