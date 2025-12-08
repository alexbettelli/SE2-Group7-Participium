import { Outlet } from "react-router";
import PropTypes from 'prop-types';
import DefaultFooter from './Footer';
import NavHeader from './NavBar';
import { Container } from "react-bootstrap";
import "../styles/commonStyle.css";

function DefaultLayout(props) {
    const { user, handleLogout, unreadNotifications, setUnreadNotifications } = props;
    return (
        <div className="main-layout">
            <NavHeader user={user} handleLogout={handleLogout} unreadNotifications={unreadNotifications} setUnreadNotifications={setUnreadNotifications} />
            <Container fluid className="main-content">
                <Outlet />
            </Container>
            <DefaultFooter />
        </div>
    );
}

DefaultLayout.propTypes = {
    user: PropTypes.object,
    handleLogout: PropTypes.func.isRequired,
    unreadNotifications: PropTypes.number,
    setUnreadNotifications: PropTypes.func.isRequired
};

export default DefaultLayout;