import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import API from '../api/API.mjs';

function NewEmployeeForm() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // basic validation
    if (!form.username || !form.password || !form.email || !form.firstName || !form.lastName) {
      setError('Compila tutti i campi obbligatori.');
      return;
    }
    if (form.password.length < 6) {
      setError('La password deve avere almeno 6 caratteri.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        username: form.username,
        password: form.password,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        typeId: 6
      };

      await API.registrate(data);
      setSuccess('Utente creato con successo.');
      setForm({ username: '', password: '', email: '', firstName: '', lastName: '' });
      
    } catch (err) {
      setError(err?.message || String(err) || 'Errore durante la creazione dell\'utente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="username" className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="password" className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </Form.Group>

        <Form.Group controlId="email" className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="firstName" className="mb-3">
          <Form.Label>First name</Form.Label>
          <Form.Control
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="lastName" className="mb-3">
          <Form.Label>Last name</Form.Label>
          <Form.Control
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group>
          <Button type="submit" disabled={loading} className="me-2">
            {loading ? <><Spinner animation="border" size="sm" /> Creazione...</> : 'Crea utente'}
          </Button>
        </Form.Group>
      </Form>
    </div>
  );
}

export default NewEmployeeForm;
