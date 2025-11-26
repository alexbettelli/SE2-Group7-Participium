import { Outlet } from "react-router";
import DefaultFooter from './Footer';
import NavHeader from './NavBar';
import { Container } from "react-bootstrap";
import "../styles/commonStyle.css";

function DefaultLayout(props){
    const { user, handleLogout, unreadNotifications, setUnreadNotifications } = props;
    return (
        <div className="main-layout">
            <NavHeader user={user} handleLogout={handleLogout} unreadNotifications={unreadNotifications} setUnreadNotifications={setUnreadNotifications}/>            
            <Container fluid className="main-content">
                <Outlet />
            </Container>
            <DefaultFooter/>      
        </div>
    );
}

export default DefaultLayout;