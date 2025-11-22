import { Navbar, Container, Nav, Button } from "react-bootstrap";
import {useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import API from '../api/API.mjs';
import "../styles/NavBar.css";

function NavHeader(props){
  const {user, handleLogout, unreadNotifications, setUnreadNotifications} = props;
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState(null);

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleLogoutClick = async () => {
    if (handleLogout) {
      await handleLogout();
      navigate('/');
    }
  };

  useEffect(() => {
      if(!user || !user?.id)
            return;
      const fetchUnreadNotifications = async () => {
        try {
            const reports = await API.getMyReports();
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
    <Navbar className="navbar-participium">
      <Container fluid className="navbar-container">
        
        {/* Left side: PARTICIPIUM + Welcome message */}
        <div className="navbar-left">
          <Navbar.Brand onClick={handleHomeClick} className="navbar-brand-participium">
            PARTICIPIUM
          </Navbar.Brand>
          
          {user ? (
            <span className="navbar-user">
              Welcome, <span className="username-bold">{user.username || 'User'}</span>
            </span>
          ) : (
            <span className="navbar-user">
              Please log in to continue
            </span>
          )}
        </div>
        
        <div className="navbar-right">
          {user && (
            <div onClick={() => navigate("/myreports")} >  
                {unreadNotifications > 0 ? (
                  <span className="navbar-notification-wrapper">
                    <i className="bi bi-envelope navbar-profile-icon"></i>
                    <span className="navbar-notification-count">{unreadNotifications}</span>
                  </span>
                ) : <i className="bi bi-envelope navbar-profile-icon"></i>}
            </div>
          )}

          {user && user.role?.id === 1 && ( 
            <div onClick={() => navigate("/profile")} >
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
        </div>
      </Container>
    </Navbar>   
  );
}

export default NavHeader;