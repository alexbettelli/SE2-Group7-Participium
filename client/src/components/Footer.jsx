import { Container, Row, Col } from "react-bootstrap";
import "../styles/Footer.css";

function DefaultFooter(){
    return(
        <footer className="footer-participium">
            <Container fluid className="py-5">
                <Row className="justify-content-center text-center">
                    <Col lg={10} xl={8}>
                        <Row className="align-items-start">
                            <Col md={4} className="mb-5 mb-md-0">
                                <div className="footer-brand">
                                    <h5 className="footer-title mb-2">PARTICIPIUM</h5>
                                    <p className="footer-subtitle">Digital Platform for Civic Participation</p>
                                </div>
                            </Col>
                            
                            <Col md={4} className="mb-5 mb-md-0">
                                <div className="footer-city">
                                    <h6 className="city-name mb-3">City of Turin</h6>
                                </div>
                            </Col>
                            
                            <Col md={4} className="mb-4 mb-md-0">
                                <div className="footer-links">
                                    <a href="#privacy" className="footer-link">Privacy Policy</a>
                                    <a href="#terms" className="footer-link">Terms of Use</a>
                                    <a href="#contact" className="footer-link">Contact</a>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                
                <Row className="mt-4 pt-4 border-top justify-content-center">
                    <Col lg={8} className="text-center">
                        <p className="footer-copyright mb-0">
                            &copy; 2025 Participium - Municipality of Turin | Developed by Group 7
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}

export default DefaultFooter;