const SERVER_URL = 'http://localhost:3001';

const registrate = async (data) => {
    const res = await fetch(SERVER_URL + '/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })

    if (res.ok) {
        const user = await res.json();
        return user;
    } else {
        let errMessage = 'Error:user not saved!';
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
    logOut
};
export default LoggingAPI;