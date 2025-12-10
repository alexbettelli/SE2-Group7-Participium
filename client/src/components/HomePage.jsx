import { Navigate } from 'react-router';
import PropTypes from 'prop-types';
import '../styles/commonStyle.css';
import TechnicalOfficeStaffMemberPage from './TechnicalOfficeStaffMemberPage';
import CitizenPage from './CitizenPage';
import AdminPage from './AdminPage';
import PrOfficerPage from './PrOfficerPage';
import ExternalMaintainerPage from './ExternalMaintainerPage';
import NotFound from './NotFound';

export default function HomePage(props) {
  if (!props.user) return <Navigate to="/" replace />; //back to login

  switch (props.user.role.id) {
    case 1:
      return <CitizenPage user={props.user} setChatWith={props.setChatWith}/>;
    case 2:
      return <AdminPage user={props.user} />;
    case 3:
      return <PrOfficerPage user={props.user} />;
    case 4:
      return <TechnicalOfficeStaffMemberPage user={props.user} setSelectedReport={props.setSelectedReport} setChatWith={props.setChatWith}/>;
    case 6:
      return <ExternalMaintainerPage user={props.user} setSelectedReport={props.setSelectedReport} setChatWith={props.setChatWith}/>;
    default:
      return <NotFound />;
  }
};

HomePage.propTypes = {
  user: PropTypes.shape({
    role: PropTypes.shape({
      id: PropTypes.number.isRequired
    }).isRequired
  }),
  setSelectedReport: PropTypes.func
};