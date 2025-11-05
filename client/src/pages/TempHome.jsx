import { useNavigate } from 'react-router-dom';
import '../App.css';

export function HomePage() {
  const navigate = useNavigate();

  const handleOverview = () => {
    const mockReport = {
      id: 1,
      title: "Dangerous hole in the road in Via Roma",
      description: "A large hole has formed in the road, posing a risk to vehicles and pedestrians.",
      category: "Roads and Urban Furnishings",
      latitude: 45.0703,
      longitude: 7.6869,
      photos: [
        "https://picsum.photos/400/300?random=1",
        "https://picsum.photos/400/300?random=2"
      ],
      isAnonymous: false,
      author: "Mario Rossi",
      createdAt: new Date().toISOString(),
      status: "Pending Approval"
    };

    navigate('/report-overview', { state: { report: mockReport } }); //pass here the report data
  };

  return (
    <div className="home-container">
      <h1>Participium - TEMPORARY HOME</h1>
      
      <button 
        className="btn btn-primary" 
        onClick={handleOverview} >
        Test ReportOverview
      </button>
    </div>
  );
}