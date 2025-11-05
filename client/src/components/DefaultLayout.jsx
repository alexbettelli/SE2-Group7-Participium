import { Outlet } from "react-router";
import DefaultFooter from './Footer';
import NavHeader from './NavBar';
import { Container } from "react-bootstrap";

function DefaultLayout(){
    return (
        <>
            <NavHeader />            
            <Container fluid>
                <Outlet />
            </Container>
            <DefaultFooter/>      
        </>
    );
}

export default DefaultLayout;