import CitizenPage from './CitizenPage';
import AdminPage from './AdminPage';
import NotFound from './NotFound';
import {Navigate} from 'react-router';
import '../styles/commonStyle.css';


export default function  HomePage (props) {
  if (!props.user) return <Navigate to="/" replace />; //back to login

  switch (props.user.role.id) {
    case 1:
      return <CitizenPage user={props.user}/>;
    case 2:
      return <AdminPage user={props.user}/>;
    default:
      return <NotFound />;
  }
};