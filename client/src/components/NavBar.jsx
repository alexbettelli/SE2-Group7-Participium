import { Navbar, Container, Nav, Button } from "react-bootstrap";
import {useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import "../styles/NavBar.css";

function NavHeader(props){
  const {user, handleLogout} = props;
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
      const fetchProfilePhoto = async () => {
          // Reset photo when user changes or logs out
          setProfilePhoto(null);
          if (user && user.imageUrl) {
            setProfilePhoto(`http://localhost:3001${user.imageUrl}`);
          }
      };

      fetchProfilePhoto();
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
        
        {/* Right side: Home + Login/Logout */}
        <div className="navbar-right">
          {user && (
            <div onClick={() => navigate("/myreports")} >  
                <i className="bi bi-bell navbar-profile-icon"></i>
            </div>
          )}

          {user && (
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