import CitizenPage from './CitizenPage';
import NotFound from './NotFound';
import {Navigate} from 'react-router';

export default function  HomePage (props) {
  if (!props.user) return <Navigate to="/" replace />; //back to login

  switch (props.user.typeId) {
    case 1:
      return <CitizenPage user={props.user} />;
    //ADD here you're specific user type cases
    default:
      return <NotFound />;
  }
};