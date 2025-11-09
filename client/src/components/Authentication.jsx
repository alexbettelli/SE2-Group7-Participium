import { Button, Form } from "react-bootstrap";
import {useState, useActionState } from 'react'
import API from '../api/API.mjs'
import "../styles/Authentication.css";

function AuthenticateForm(props){

    const [isLogin, setIsLogin] = useState(true);

    const handleToggle = () => {
        setIsLogin(!isLogin);
    };    

    return (               
        <div className="auth-container">
            <div className="auth-form-wrapper">
                {isLogin 
                ? <LogInForm handleLogin={props.handleLogin} handleToggle={handleToggle}/> 
                : <RegistrationForm handleToggle={handleToggle}/>}                           
            </div>
        </div>               
    );
}


function LogInForm(props){
    const [state, formAction, isPending] = useActionState(
        login,
        {username: '', password: ''}
    );
    async function login(prevState, formData) {
        
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        }

        try {
            await props.handleLogin(credentials);
            return {success : true}
        } catch (error) {
            return {error: 'Access denied. Email or password incorrect!'}
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
                    <Form.Control type='password' name='password' required minLength={6} className="auth-input"/>
                </Form.Group>  
                <Form.Group className="auth-button-group">                            
                    <Button className='auth-btn-primary' type='submit'>Log In</Button>
                    <Button className='auth-btn-link' variant="link" type="button" onClick={props.handleToggle}>Create new account</Button>
                </Form.Group>  
            </Form>
        </div> 
    )
}

function RegistrationForm(props){
    const [state, formAction, isPending] = useActionState(
        registrate,
        {username: '', password: '', email: '', firstName: '', lastName: ''}
    );
    async function registrate(prevState, formData) {
        
        const data = {
            username: formData.get('username'),
            password: formData.get('password'),
            email : formData.get('email'),
            firstName : formData.get('firstName'),
            lastName : formData.get('lastName'),
            typeId : 1
        }

        try {
            await API.registrate(data);
            props.handleToggle();
            return {success : true}
        } catch (error) {
            return {error: 'Accesso fallito. Email o password errati!'}
        }
    }

    return (
        <div className="auth-form register-form">              
            <h2 className="auth-title">Create new account</h2>
            <Form action={formAction} className="auth-form-element">
                <Form.Group controlId='username' className='auth-form-group'>
                    <Form.Label className="auth-label">Username</Form.Label>
                    <Form.Control type='text' name='username' required className="auth-input" />
                </Form.Group>  
                <Form.Group controlId='password' className="auth-form-group">
                    <Form.Label className="auth-label">Password</Form.Label>
                    <Form.Control type='password' name='password' required minLength={6} className="auth-input"/>
                </Form.Group>    
                <Form.Group controlId='email' className='auth-form-group'>
                    <Form.Label className="auth-label">Email</Form.Label>
                    <Form.Control type='email' name='email' required className="auth-input" />
                </Form.Group>    
                <Form.Group controlId='firstName' className='auth-form-group'>
                    <Form.Label className="auth-label">First name</Form.Label>
                    <Form.Control type='text' name='firstName' required className="auth-input" />
                </Form.Group>    
                <Form.Group controlId='lastName' className='auth-form-group'>
                    <Form.Label className="auth-label">Last name</Form.Label>
                    <Form.Control type='text' name='lastName' required className="auth-input" />
                </Form.Group>    
                <Form.Group className="auth-button-group">                            
                    <Button className='auth-btn-primary' type='submit'>Create</Button>
                    <Button className="auth-btn-link" variant="link" type="button" onClick={props.handleToggle}>Have you an account yet?</Button>
                </Form.Group> 
            </Form>   
        </div>
    )
}

export default AuthenticateForm