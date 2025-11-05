import { Container, Row, Image } from "react-bootstrap";
import { Link } from "react-router";
import error from '../assets/error.png'

export default function NotFound(){
    return (
        <Container className="h-100 d-flex align-items-center flex-column justify-content-center">
            <Row className="mb-3 fs-4 fw-bold">
                <p>There's nothing to see here...this isn't the page you're looking for!</p>
            </Row>
            <Row className="mb-3">
                <Image src={error} height="200px" />
            </Row>
            <Row>
                <Link type="button" className="btn btn-primary" to="/">Return to site</Link>
            </Row>

        </Container>
        
    );
}