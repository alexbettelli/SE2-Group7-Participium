import { Button, Form } from "react-bootstrap";
import {useState } from 'react'

function AuthenticateForm(props){

    const [isLogin, setIsLogin] = useState(true);
    const handleToggle = () => {
        setIsLogin(!isLogin);
    };
    return (               
        <div >
            <div>
                {isLogin ? 
                <>                
                    <h2>Log In</h2>
                    <Form /* action={formAction} */>
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
                            <Button className='mx-2 my-2'  variant="link" type="button" onClick={handleToggle}>Create new account</Button>
                        </Form.Group>  
                    </Form>   
                </>
                : 
                <>                
                    <h2>Create new account</h2>
                    <Form /* action={formAction} */>
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
                            <Button variant="link" type="button" onClick={handleToggle}>Have you an account yet?</Button>
                        </Form.Group> 
                    </Form>   
                </>}
                           
            </div>
        </div>               
    );
}

export default AuthenticateForm