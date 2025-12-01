import '../styles/NewEmployeeForm.css';

import { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

import UserAPI from '../api/UserAPI.mjs';

function NewEmployeeForm({ onSuccess }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

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
    if (form.email.indexOf('@') === -1) {
      setError('Inserisci un indirizzo email valido.');
      return;
    }
    if (form.email.indexOf('.') === -1) {
      setError('Inserisci un indirizzo email valido.');
      return;
    }


    try {
      const data = {
        username: form.username,
        password: form.password,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName
      };

      await UserAPI.createNewEmployee(data);
      setSuccess('Employee created successfully.');
      setForm({ username: '', password: '', email: '', firstName: '', lastName: '' });
      if (onSuccess) await onSuccess();

    } catch (err) {
      setError(err?.message || String(err) || 'Error: employee not created.');
    }
  };

  return (
    <div className="new-employee-form-container">
      <div
        className="new-employee-form-title"
        style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => setShowForm((v) => !v)}
        aria-expanded={showForm}
        tabIndex={0}
      >
        <span>Create an employee account</span>
        <span style={{ fontSize: '1.5rem', marginLeft: '1rem', transition: 'transform 0.2s', transform: showForm ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
      </div>
      {showForm && (
        <div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="username" className="form-group">
              <Form.Label>Username <span>*</span></Form.Label>
              <Form.Control
                className="form-control"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="password" className="form-group">
              <Form.Label>Password <span>*</span></Form.Label>
              <Form.Control
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </Form.Group>

            <Form.Group controlId="email" className="form-group">
              <Form.Label>Email <span>*</span></Form.Label>
              <Form.Control
                className="form-control"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="firstName" className="form-group">
              <Form.Label>First name <span>*</span></Form.Label>
              <Form.Control
                className="form-control"
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="lastName" className="form-group">
              <Form.Label>Last name <span>*</span></Form.Label>
              <Form.Control
                className="form-control"
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <div className="form-buttons-row">
              <button type="submit" className="submit-button">
                Create account
              </button>
              <Button variant="outline-secondary" onClick={() => setShowForm(false)} style={{ height: '48px', fontWeight: 600, borderRadius: '12px' }}>
                Cancel
              </Button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}

export default NewEmployeeForm;
