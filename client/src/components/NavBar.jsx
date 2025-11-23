import { Navbar, Container } from "react-bootstrap";
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import "../styles/NavBar.css";

function NavHeader(props){
  const {user, handleLogout} = props;
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHomeClick = () => {
    navigate('/');
    setMobileMenuOpen(false); 
  };

  const handleLogoutClick = async () => {
    if (handleLogout) {
      await handleLogout();
      navigate('/');
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    if (user?.imageUrl) {
      setProfilePhoto(`http://localhost:3001${user.imageUrl}`);
    } else {
      setProfilePhoto(null);
    }
  }, [user]);

  return(    
    <Navbar className="navbar-participium">
      <Container fluid className="navbar-container">
        

        <Navbar.Brand onClick={handleHomeClick} className="navbar-brand-participium">
          PARTICIPIUM
        </Navbar.Brand>
        

        <div className="navbar-desktop-elements desktop-only">

            <div className="navbar-left-content">
                {user ? (
                    <span className="navbar-user">
                    Welcome, <span className="username-bold">{user.username || 'User'}</span>
                    </span>
                ) : (
                    <span className="navbar-user">Please log in to continue</span>
                )}
            </div>


            <div className="navbar-right-content">
                {user && (
                    <div onClick={() => navigate("/myreports")} className="navbar-icon-wrapper">  
                        <i className="bi bi-bell navbar-profile-icon"></i>
                    </div>
                )}

                {user && (
                    <div onClick={() => navigate("/profile")} className="navbar-icon-wrapper">
                    {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="navbar-profile-icon"/>
                    ) : (
                        <i className="bi bi-person-circle navbar-profile-icon"></i>
                    )}
                    </div>
                )}

                <button onClick={handleHomeClick} className="nav-home-btn">
                    Home
                </button>
            
                {user && handleLogout && (
                    <button className="nav-home-btn" onClick={handleLogoutClick}>
                    Logout
                    </button>
                )}
            </div>
        </div>


        <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation"
        >
            <span className="mobile-menu-toggle-icon"></span>
        </button>

        {/* 4. MOBILE MENU  */}
        <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'show' : ''}`}>
            <div className="navbar-mobile-menu-items">
                
                {/* Welcome Message Mobile */}
                {user ? (
                    <div className="mobile-user-info">
                        <span>Welcome, <b>{user.username}</b></span>
                    </div>
                ) : (
                    <div className="mobile-user-info">Please log in</div>
                )}

                <hr className="mobile-divider"/>

                {/* Icons converted to list items */}
                {user && (
                    <div className="mobile-icons-row">
                        <div onClick={() => {navigate("/myreports"); setMobileMenuOpen(false)}} className="mobile-icon-item">
                            <i className="bi bi-bell"></i> <span>Notifications</span>
                        </div>
                        <div onClick={() => {navigate("/profile"); setMobileMenuOpen(false)}} className="mobile-icon-item">
                            {profilePhoto ? (
                                <img src={profilePhoto} alt="Profile" className="mobile-profile-img"/>
                            ) : (
                                <i className="bi bi-person-circle"></i>
                            )}
                            <span>Profile</span>
                        </div>
                    </div>
                )}

                <hr className="mobile-divider"/>

                {/* Navigation Buttons */}
                <button onClick={handleHomeClick} className="navbar-mobile-menu-item">
                    <i className="bi bi-house-door"></i> Home
                </button>
                
                {user && handleLogout && (
                    <button onClick={handleLogoutClick} className="navbar-mobile-menu-item">
                        <i className="bi bi-box-arrow-right"></i> Logout
                    </button>
                )}
            </div>
        </div>

      </Container>
    </Navbar>   
  );
}

export default NavHeader;