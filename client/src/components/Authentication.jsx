import "../styles/Authentication.css";

import { Button, Form } from "react-bootstrap";
import { useState, useActionState } from 'react'

import LoggingAPI from '../api/LoggingAPI.mjs';


function AuthenticateForm(props) {

    const [isLogin, setIsLogin] = useState(true);

    const handleToggle = () => {
        setIsLogin(!isLogin);
    };

    return (
        <div className="auth-container">
            <div className={`auth-form-wrapper ${isLogin ? 'login-form-wrapper' : 'register-form-wrapper'}`}>
                {isLogin
                    ? <LogInForm handleLogin={props.handleLogin} handleToggle={handleToggle} loginError={props.loginError} />
                    : <RegistrationForm handleToggle={handleToggle} />}
            </div>
        </div>
    );
}


function LogInForm(props) {
    const [state, formAction, isPending] = useActionState(
        login,
        { username: '', password: '' }
    );
    async function login(prevState, formData) {
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        }

        try {
            await props.handleLogin(credentials);
            return { success: true }
        } catch (error) {
            return { error: error.message || 'Access denied. Email or password incorrect!' }
        }
    }
    return (
        <div className="auth-form login-form">
            <h2 className="auth-title">Log In</h2>
            <Form action={formAction} className="auth-form-element">
                <Form.Group controlId='username' className="auth-form-group">
                    <Form.Label className="auth-label">Username</Form.Label>
                    <Form.Control type='text' name='username' required className="auth-input" />
                </Form.Group>
                <Form.Group controlId='password' className="auth-form-group">
                    <Form.Label className="auth-label">Password</Form.Label>
                    <Form.Control type='password' name='password' required minLength={6} className="auth-input" />
                </Form.Group>
                <Form.Group className="auth-button-group">
                    <Button className='auth-btn-primary' type='submit'>Log In</Button>
                    <Button className='auth-btn-link' variant="link" type="button" onClick={props.handleToggle}>Create new account</Button>
                </Form.Group>
            </Form>
            {(state?.error || props.loginError) && (
                <div className="auth-error-message">{state?.error || props.loginError}</div>
            )}
        </div>
    )
}

function RegistrationForm(props) {
    const [state, formAction, isPending] = useActionState(
        registrate,
        { username: '', password: '', email: '', firstName: '', lastName: '' }
    );
    async function registrate(prevState, formData) {

        const data = {
            username: formData.get('username'),
            password: formData.get('password'),
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            typeId: 1
        }

        try {
            await LoggingAPI.registrate(data);
            props.handleToggle();
            return { success: true }
        } catch (error) {
            return { error: 'Username already in use. Please choose another username or log in if you already have an account.' }
        }
    }

    return (
        <div className="auth-form register-form">
            <h2 className="auth-title">Create new account</h2>
            <Form action={formAction} className="auth-form-element">
                <div className="auth-form-row">
                    <Form.Group controlId='username' className='auth-form-group'>
                        <Form.Label className="auth-label">Username</Form.Label>
                        <Form.Control type='text' name='username' required className="auth-input" />
                    </Form.Group>
                    <Form.Group controlId='email' className='auth-form-group'>
                        <Form.Label className="auth-label">Email</Form.Label>
                        <Form.Control type='email' name='email' required className="auth-input" />
                    </Form.Group>
                </div>
                <Form.Group controlId='password' className="auth-form-group">
                    <Form.Label className="auth-label">Password</Form.Label>
                    <Form.Control type='password' name='password' required minLength={6} className="auth-input" />
                </Form.Group>
                <div className="auth-form-row">
                    <Form.Group controlId='firstName' className='auth-form-group'>
                        <Form.Label className="auth-label">First name</Form.Label>
                        <Form.Control type='text' name='firstName' required className="auth-input" />
                    </Form.Group>
                    <Form.Group controlId='lastName' className='auth-form-group'>
                        <Form.Label className="auth-label">Last name</Form.Label>
                        <Form.Control type='text' name='lastName' required className="auth-input" />
                    </Form.Group>
                </div>
                <Form.Group className="auth-button-group">
                    <Button className='auth-btn-primary' type='submit'>Create</Button>
                    <Button className="auth-btn-link" variant="link" type="button" onClick={props.handleToggle}>Do you already have an account?</Button>
                </Form.Group>
            </Form>
            {state?.error && (
                <div className="auth-error-message">{state.error}</div>
            )}
        </div>
    )
}

export default AuthenticateForm