const SERVER_URL = 'http://localhost:3001';

const getCategories = async() => {
    const res = await fetch(SERVER_URL + '/categories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' 
    });
    if (res.ok) {
        const categories = await res.json();
        return categories;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error fetching categories');
    }
};
const getOffices = async() => {
    const res = await fetch(SERVER_URL + '/offices', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' 
    });
    if (res.ok) {
        const offices = await res.json();
        return offices;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error fetching offices');
    }
};
const getRoles = async() => {
    const res = await fetch(SERVER_URL + '/roles', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' 
    });
    if (res.ok) {
        const roles = await res.json();
        return roles;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error fetching roles');
    }
};  

export {
    getCategories,
    getOffices,
    getRoles
};