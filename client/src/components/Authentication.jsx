import { Button, Form } from "react-bootstrap";
import {useState, useActionState } from 'react'
import API from '../api/API.mjs'

function AuthenticateForm(props){

    const [isLogin, setIsLogin] = useState(true);

    const handleToggle = () => {
        setIsLogin(!isLogin);
    };    

    return (               
        <div >
            <div>
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
        <>
            <h2>Log In</h2>
            <Form  action={formAction}>
                <Form.Group controlId='username' >
                    <Form.Label>Username</Form.Label>
                    <Form.Control type='text' name='username' required />
                </Form.Group>   
                <Form.Group controlId='password' >
                    <Form.Label>Password</Form.Label>
                    <Form.Control type='password' name='password' required minLength={6}/>
                </Form.Group>  
                <Form.Group >                            
                    <Button className='mx-2 my-2' type='submit'>Log In</Button>
                    <Button className='mx-2 my-2'  variant="link" type="button" onClick={props.handleToggle}>Create new account</Button>
                </Form.Group>  
            </Form>
        </> 
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
        <>                
            <h2>Create new account</h2>
            <Form action={formAction}>
                <Form.Group controlId='username' className='mb-3'>
                    <Form.Label>Username</Form.Label>
                    <Form.Control type='text' name='username' required />
                </Form.Group>  
                <Form.Group controlId='password' >
                    <Form.Label>Password</Form.Label>
                    <Form.Control type='password' name='password' required minLength={6}/>
                </Form.Group>    
                <Form.Group controlId='email' className='mb-3'>
                    <Form.Label>Email</Form.Label>
                    <Form.Control type='email' name='email' required />
                </Form.Group>    
                <Form.Group controlId='firstName' className='mb-3'>
                    <Form.Label>First name</Form.Label>
                    <Form.Control type='text' name='firstName' required />
                </Form.Group>    
                <Form.Group controlId='lastName' className='mb-3'>
                    <Form.Label>Last name</Form.Label>
                    <Form.Control type='text' name='lastName' required />
                </Form.Group>    
                <Form.Group >                            
                    <Button className='mx-2 my-2' type='submit'>Create</Button>
                    <Button variant="link" type="button" onClick={props.handleToggle}>Have you an account yet?</Button>
                </Form.Group> 
            </Form>   
        </>
    )
}

export default AuthenticateForm