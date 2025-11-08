import { useActionState } from "react";
import { Form, Button, Alert, Row, Col } from "react-bootstrap";
import dayjs from "dayjs";
import { useNavigate, useParams, useLocation, Link } from "react-router";
import API from "../api/API.mjs";
import NewEmployeeForm from './NewEmployeeForm.jsx';

export default function AdminPage() {
    return (
        <>
            <h1>Admin Page</h1>
            <p>Welcome, Admin! Here you can manage the system.</p>
            <section className="my-4">
                <h2>Crea nuovo utente</h2>
                <NewEmployeeForm />
            </section>
        </>
    );
}