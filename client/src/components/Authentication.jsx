import "../styles/Authentication.css";
import { Button, Form } from "react-bootstrap";
import { useState, useActionState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router';
import PropTypes from 'prop-types';

import LoggingAPI from '../api/LoggingAPI.mjs';
import dayjs from "dayjs";
import Loader from "./Loader";

export default function AuthenticationScreen(props) {
    const screen = Object.freeze({ LOGIN: 'login', REGISTER: 'register', VERIFY: 'verify' });
    const navigate = useNavigate();
    const [ currentScreen, setCurrentScreen ] = useState(screen.LOGIN);
    const [ temporaryUser, setTemporaryUser ] = useState(null);

    const changeScreen = (screen) => {
        setCurrentScreen(screen);
    }

    return (
        <div className="auth-container">
            { 
                currentScreen === screen.LOGIN && (
                    <div className={`auth-form-wrapper login-form-wrapper`}>
                        <div className="auth-info-section">
                            <p className="auth-info-description">
                                Report issues in your city and help make Turin a better place. 
                                Submit reports about problems you encounter, track their progress, 
                                and stay informed about municipal services.
                            </p>
                        </div>
                        <LogInForm 
                            handleLogin={props.handleLogin} 
                            redirectRegister={() => changeScreen(screen.REGISTER)} loginError={props.loginError} 
                            navigate={navigate}
                        />
                    </div>
                )
            }
            {
                currentScreen === screen.REGISTER && (
                    <div className={`auth-form-wrapper register-form-wrapper`}>
                        <div className="auth-info-section">
                            <p className="auth-info-description">
                                Report issues in your city and help make Turin a better place. 
                                Submit reports about problems you encounter, track their progress, 
                                and stay informed about municipal services.
                            </p>
                        </div>
                        <RegistrationForm 
                            redirectLogin={() => changeScreen(screen.LOGIN)} 
                            redirectVerify={() => changeScreen(screen.VERIFY)}
                            setTemporaryUser={setTemporaryUser} 
                            navigate={navigate}
                        />
                    </div>
                )
            }
            {
                currentScreen === screen.VERIFY && (
                    <div className={`auth-form-wrapper otp-form-wrapper`}>
                        <OTPForm 
                            redirectLogin={() => changeScreen(screen.LOGIN)} 
                            setTemporaryUser={setTemporaryUser}
                            username={temporaryUser?.username} 
                            email={temporaryUser?.email} 
                            date={dayjs()} /> 
                    </div>
                )
            }
            </div>
    )
}

AuthenticationScreen.propTypes = {
    handleLogin: PropTypes.func.isRequired,
    loginError: PropTypes.string
};

function LogInForm(props) {
    const [state, formAction, isPending] = useActionState(login,{ username: '', password: '' });

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
                    <Button className='auth-btn-link' variant="link" type="button" onClick={props.redirectRegister}>Create new account</Button>
                </Form.Group>
            </Form>
            {(state?.error || props.loginError) && (
                <div className="auth-error-message">{state?.error || props.loginError}</div>
            )}
            <div className="auth-help-link-inline">
                <button onClick={() => props.navigate('/help')} className="help-link-button-inline">
                    Need help? Visit our Help Center
                </button>
            </div>
        </div>
    )
}

LogInForm.propTypes = {
    handleLogin: PropTypes.func.isRequired,
    redirectRegister: PropTypes.func.isRequired,
    loginError: PropTypes.string,
    navigate: PropTypes.func.isRequired
};

function RegistrationForm(props) {
    const [state, formAction, isPending] = useActionState(registrate, { username: '', password: '', email: '', firstName: '', lastName: '' });

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
            props.setTemporaryUser({ username: data.username, email: data.email });
            props.redirectVerify();
            return { success: true }
        } catch (error) {
            return { error: 'This user already exists. Please log in if you already have an account.' }
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
                    {
                        isPending ? <Loader /> : <Button className='auth-btn-primary' type='submit' disabled={isPending}>Create</Button>
                    }
                    <SignInButton redirectLogin={props.redirectLogin} />
                </Form.Group>
            </Form>
            {state?.error && (
                <div className="auth-error-message">{state.error}</div>
            )}
            <div className="auth-help-link-inline">
                <button onClick={() => props.navigate('/help')} className="help-link-button-inline">
                    Need help? Visit our Help Center
                </button>
            </div>
        </div>
    )
}

RegistrationForm.propTypes = {
    redirectLogin: PropTypes.func.isRequired,
    redirectVerify: PropTypes.func.isRequired,
    setTemporaryUser: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired
};

function SignInButton(props) {
    return <Button className="auth-btn-link" variant="link" type="button" onClick={props.redirectLogin}>Do you already have an account?</Button>;
}

SignInButton.propTypes = {
    redirectLogin: PropTypes.func.isRequired
};

function OTPForm(props) {
    const verifyOTP = async (prevState, formData) => {
        try {
            let otp = "";
            for (let i = 1; i <= 6; i++) otp += formData.get(`otp${i}`);
            otp = otp.toUpperCase();
            await LoggingAPI.verifyOTP(otp);
            props.redirectLogin();
        }catch(error) {
            return { error: error.message || 'OTP verification failed!'}
        }
    }

    const [state, formAction, isPending] = useActionState(verifyOTP, { "otp1":  "", "otp2":  "", "otp3":  "", "otp4":  "", "otp5":  "", "otp6":  "" });
    const inputsRef = useRef([]);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(60);
    const [date, setDate] = useState(props.date);
    const [resending, setResending] = useState(false);

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
            setResending(true);
            await LoggingAPI.resendOTP();
            setTimer(60);
            setDate(dayjs());
            setError(null);
            inputsRef.current[0].focus();
            setResending(false);
        } catch(error) {
            inputsRef.current[0].focus();
            setError(error.message || 'OTP resend failed!');
            setResending(false);
        }
    }

    return (
        <div className="auth-form otp-form">
            <h2 className="auth-title">Verify your account</h2>
            <p className="auth-info-message" style={{ textAlign: "center" }}>Welcome {props.username}! A confirmation code has been sent to <strong>{props.email}</strong>. <br/>Please enter it below to verify your account.</p>
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
                    { isPending ? <Loader /> : <Button className='auth-btn-primary' type='submit'>Verify</Button> }
                    { resending ? <Loader /> : <Button className="auth-btn-link" variant="link" type="button" onClick={resendOTP} disabled={timer !== 0}>Email not received? Resend {timer !== 0 ? `in ${timer}s` : 'now'}</Button> }
                    <SignInButton redirectLogin={props.redirectLogin} />
                </Form.Group>
                {state?.error && (
                    <div className="auth-error-message">{state.error}</div>
                )}
            </Form>
        </div>
    )
}

OTPForm.propTypes = {
    redirectLogin: PropTypes.func.isRequired,
    setTemporaryUser: PropTypes.func.isRequired,
    username: PropTypes.string,
    email: PropTypes.string,
    date: PropTypes.object
};