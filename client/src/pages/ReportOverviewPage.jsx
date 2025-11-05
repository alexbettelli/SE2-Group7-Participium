import { useLocation, useNavigate } from 'react-router-dom';
import ReportOverview from '../components/ReportOverview.jsx';

export function ReportOverviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const report = location.state?.report;

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <ReportOverview 
      report={report}
      onBackToHome={handleBackToHome}
    />
  );
}