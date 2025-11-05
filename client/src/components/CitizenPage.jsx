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
      photos: ["https://picsum.photos/400/300?random=1",
        "https://picsum.photos/400/300?random=2",
        "https://picsum.photos/400/300?random=3" ],
      isAnonymous: false,
      author: "Mario Rossi",
      status: "Pending Approval"
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