import "../styles/Authentication.css";
import { Button, Form } from "react-bootstrap";
import { useState, useActionState, useRef, useEffect } from 'react'

import LoggingAPI from '../api/LoggingAPI.mjs';
import dayjs from "dayjs";

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
    const [verifyOTP, setVerifyOTP] = useState(false);
    const [tempUser, setTempUser] = useState(null);

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
            setVerifyOTP(true);
            setTempUser({ username: data.username, email: data.email });
            return { success: true }
        } catch (error) {
            return { error: 'Username already in use. Please choose another username or log in if you already have an account.' }
        }
    }

    return (
        <>
            {
                verifyOTP ? 
                    <OTPForm handleToggle={props.handleToggle} username={tempUser?.username} email={tempUser?.email} date={dayjs()} /> 
                        :             
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
                                <SignInButton handleToggle={props.handleToggle} />
                            </Form.Group>
                        </Form>
                        {state?.error && (
                            <div className="auth-error-message">{state.error}</div>
                        )}
                        { isPending && <div className="auth-info-message">Processing your registration...</div>}
                    </div>
                }
        </>
    )
}

function SignInButton(props) {
    return <Button className="auth-btn-link" variant="link" type="button" onClick={props.handleToggle}>Do you already have an account?</Button>;
}

function OTPForm(props) {
    const verifyOTP = async (prevState, formData) => {
        try {
            let otp = "";
            for (let i = 1; i <= 6; i++) otp += formData.get(`otp${i}`);
            otp = otp.toUpperCase();
            await LoggingAPI.verifyOTP(otp);
            props.handleToggle();
        }catch(error) {
            return { error: error.message || 'OTP verification failed!'}
        }
    }

    const [state, formAction, isPending] = useActionState(verifyOTP, { "otp1":  "", "otp2":  "", "otp3":  "", "otp4":  "", "otp5":  "", "otp6":  "" });
    const inputsRef = useRef([]);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(60);
    const [date, setDate] = useState(props.date);

    const handleChange = (e, index) => {
        if (e.target.value.length === 1 && index < 5) {
            inputsRef.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            inputsRef.current[index - 1].focus();
        }
    };

    useEffect(() => {
        setTimeout(() => {
            if(timer > 0) setTimer(old => old - 1);
        }, 1000);
    }, [timer])

    const resendOTP = async () => {
        if(dayjs().diff(date, 'minute') < 1) {
            setError('Please wait at least 1 minute before requesting a new OTP.');
            console.log('Please wait at least 1 minute before requesting a new OTP.');
            return;
        }

        try {
            await LoggingAPI.resendOTP();
            setTimer(60);
            setDate(dayjs());
            setError(null);
            inputsRef.current[0].focus();
        } catch(error) {
            inputsRef.current[0].focus();
            setError(error.message || 'OTP resend failed!');
        }
    }

    return (
        <div className="auth-form otp-form">
            <h2 className="auth-title">Welcome {props.username}!</h2>
            <p className="auth-info-message" style={{ textAlign: "center" }}>A confirmation code has been sent to <strong>{props.email}</strong>. <br/>Please enter it below to verify your account.</p>
            <Form className="auth-form-element" action={formAction}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                    { Array.from({ length: 6 }).map((_, index) => (
                        <Form.Group controlId={`otp-${index}`} className={`otp-${index}`} key={index} style={{ display: 'inline-block', marginRight: '5px' }}>
                            <Form.Control 
                                type='text' 
                                name={`otp${index+1}`} 
                                required 
                                className="auth-input otp-input" 
                                maxLength={1} 
                                style={{ textAlign: "center", fontFamily: "monospace", width: "5rem", height: "5rem", fontSize: "2rem", textTransform: "uppercase" }}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                ref={(el) => (inputsRef.current[index] = el)}
                            />
                        </Form.Group>
                    )) }
                </div>
            
                <Form.Group className="auth-button-group">
                    <Button className='auth-btn-primary' type='submit'>Verify</Button>
                    <Button className="auth-btn-link" variant="link" type="button" onClick={resendOTP} disabled={timer !== 0}>Email not received? Resend {timer !== 0 ? `in ${timer}s` : 'now'}</Button>
                    <SignInButton handleToggle={props.handleToggle} />
                </Form.Group>
                {state?.error && (
                    <div className="auth-error-message">{state.error}</div>
                )}
            </Form>
        </div>
    )
}

export default AuthenticateForm