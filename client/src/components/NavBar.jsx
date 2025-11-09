import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import "../styles/NavBar.css";

function NavHeader(props){
  const {user, handleLogout} = props;
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleLogoutClick = async () => {
    if (handleLogout) {
      await handleLogout();
      navigate('/');
    }
  };

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
          <button 
            onClick={handleHomeClick}
            className="nav-home-btn"
          >
            Home
          </button>
          
          {user && handleLogout && (
            <Button 
              variant="outline-light" 
              className="btn-logout" 
              onClick={handleLogoutClick}
            >
              Logout
            </Button>
          )}
        </div>
      </Container>
    </Navbar>   
  );
}

export default NavHeader;