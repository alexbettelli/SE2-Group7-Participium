import { Navigate } from 'react-router';
import '../styles/commonStyle.css';
import TechnicalOfficeStaffMemberPage from './TechnicalOfficeStaffMemberPage';
import CitizenPage from './CitizenPage';
import AdminPage from './AdminPage';
import PrOfficerPage from './PrOfficerPage';
import NotFound from './NotFound';

export default function HomePage(props) {
  if (!props.user) return <Navigate to="/" replace />; //back to login

  switch (props.user.role.id) {
    case 1:
      return <CitizenPage user={props.user} />;
    case 2:
      return <AdminPage user={props.user} />;
    case 3:
      return <PrOfficerPage user={props.user} />;
    case 4:
      return <TechnicalOfficeStaffMemberPage user={props.user} setSelectedReport={props.setSelectedReport} />;
    default:
      return <NotFound />;
  }
};