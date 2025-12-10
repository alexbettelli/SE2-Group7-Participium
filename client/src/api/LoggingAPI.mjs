const SERVER_URL = 'http://localhost:3001';

const registrate = async (data) => {
    const res = await fetch(SERVER_URL + '/users/temporary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    })

    if (res.ok) {
        const message = await res.json();
        return message;
    } else {
        let errMessage = 'Error: user not saved!';
        try {
            const errDetails = await res.json();
            errMessage = errDetails.message || errMessage;
        } catch {
            const errText = await res.text();
            if (errText) errMessage = errText;
        }
        throw new Error(errMessage);
    }
}

const verifyOTP = async (otp) => {
    const res = await fetch(SERVER_URL + '/users/temporary/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otp })
    });

    if(res.ok) {
        const userId = await res.json();
        return userId;
    } else {
        let errMessage = 'Error: OTP verification failed!';
        try {
            const errDetails = await res.json();
            errMessage = errDetails.message || errMessage;
        } catch {
            const errText = await res.text();
            if (errText) errMessage = errText;
        }
        throw new Error(errMessage);
    }
}

const resendOTP = async () => {
    const res = await fetch(SERVER_URL + '/otp/resend', {
        method: 'POST',
        credentials: 'include'
    });

    if(res.ok) {
        const message = await res.json();
        return message;
    } else {
        let errMessage = 'Error: OTP resend failed!';
        try {
            const errDetails = await res.json();
            errMessage = errDetails.message || errMessage;
        } catch {
            const errText = await res.text();
            if (errText) errMessage = errText;
        }
        throw new Error(errMessage);
    }
}

const login = async (credentials) => {
    const response = await fetch(SERVER_URL + '/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
    });
    if (!response.ok) {
        if (response.status === 401) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || 'Login failed due to incorrect credentials.');
        }
        throw new Error('Server error during login.');
    }
    else {
        const user = await response.json();
        return user;
    }
};
const logOut = async () => {
    const response = await fetch(SERVER_URL + '/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    });
    if (response.ok)
        return null;
};

const LoggingAPI = {
    login,
    registrate,
    verifyOTP,
    resendOTP,
    logOut
};
export default LoggingAPI;