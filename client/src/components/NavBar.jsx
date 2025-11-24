import { Navbar, Container, Nav, Button } from "react-bootstrap";
import {useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import API from '../api/API.mjs';
import "../styles/NavBar.css";

function NavHeader(props){
  const {user, handleLogout, unreadNotifications, setUnreadNotifications} = props;
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleHomeClick = () => {
    navigate('/');
    setExpanded(false);
  };

  const handleLogoutClick = async () => {
    if (handleLogout) {
      await handleLogout();
      navigate('/');
      setExpanded(false);
    }
  };

  useEffect(() => {
      if(!user || !user?.id)
            return;
      const fetchUnreadNotifications = async () => {
        try {
            const reports = user.role.id === 1 ? await API.getMyReports() : await API.getAssignedReports();
            const totalUnreadNotifications = reports.reduce((sum, report) => sum + (report.unreadNotifications || 0), 0);
            setUnreadNotifications(totalUnreadNotifications);
        } catch (error) {
            console.error('Error fetching unread notifications:', error);
        }
      };

      fetchUnreadNotifications();
  }, [user]);

  useEffect(() => {
    console.log(user);
    if (user?.imageUrl) {
      setProfilePhoto(user.imageUrl);
    } else {
      setProfilePhoto(null);
    }
  }, [user]);


  return(    
    <Navbar expand="lg" expanded={expanded} onToggle={setExpanded} className="navbar-participium">
      <Container fluid className="navbar-container">
        
        <Navbar.Brand onClick={handleHomeClick} className="navbar-brand-participium">
          PARTICIPIUM
        </Navbar.Brand>

        <Navbar.Toggle 
          aria-controls="navbar-nav" 
          className="navbar-toggler-custom"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="navbar-toggler-icon-custom"></span>
        </Navbar.Toggle>

        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto navbar-nav-custom">
            {user ? (
              <span className="navbar-user">
                Welcome, <span className="username-bold">{user.username || 'User'}</span>
              </span>
            ) : (
              <span className="navbar-user">
                Please log in to continue
              </span>
            )}

            {user && (
              <div 
                onClick={() => {
                  user.role.id === 1 ? navigate("/myreports") : navigate("/");
                  setExpanded(false);
                }} 
                className="navbar-icon-wrapper"
              >  
                {unreadNotifications > 0 ? (
                  <span className="navbar-notification-wrapper">
                    <i className="bi bi-envelope navbar-profile-icon"></i>
                    <span className="navbar-notification-count">{unreadNotifications}</span>
                  </span>
                ) : <i className="bi bi-envelope navbar-profile-icon"></i>}
              </div>
            )}

            {user && user.role?.id === 1 && ( 
              <div 
                onClick={() => {
                  navigate("/profile");
                  setExpanded(false);
                }} 
                className="navbar-icon-wrapper"
              >
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt="Profile" 
                    className="navbar-profile-icon"
                  />
                ) : (
                  <i className="bi bi-person-circle navbar-profile-icon"></i>
                )}
              </div>
            )}

            <button 
              onClick={handleHomeClick}
              className="nav-home-btn"
            >
              Home
            </button>
          
            {user && handleLogout && (
              <button 
                className="nav-home-btn" 
                onClick={handleLogoutClick}
              >
                Logout
              </button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>   
  );
}

export default NavHeader;