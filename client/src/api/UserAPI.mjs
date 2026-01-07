const SERVER_URL = 'http://localhost:3001';

const getUserInfo = async () => {
    const res = await fetch(SERVER_URL + '/session/current', {
        credentials: 'include'
    });
    const user = await res.json();
    if (res.ok) {
        return user;
    } else {
        throw null;
    }
};
const createNewEmployee = async (data) => {
    const res = await fetch(SERVER_URL + '/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    });

    if (res.ok) {
        const employee = await res.json();
        return employee;
    } else {
        const errDetails = await res.json();
        if (errDetails.error.includes('user.email')) {
            throw new Error('This email is already in use!');
        }
        throw new Error(errDetails.error || 'Error: employee not created!');
    }
}
const updateProfile = async (formData) => {
    try {
        const res = await fetch(SERVER_URL + '/api/user/profile', {
            method: 'PUT',
            credentials: 'include',
            body: formData
        });

        if (!res.ok) {
            const errMessage = await res.json();
            throw new Error(errMessage.error || 'Error updating profile');
        }

        return await res.json();
    } catch (error) {
        throw error;
    }
}
const deleteProfilePhoto = async () => {
    const response = await fetch(`${SERVER_URL}/api/user/profile/photo`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        const errDetails = await response.text();
        throw new Error(errDetails);
    }

    return response.json();
};

const getAllEmployees = async () => {
    const res = await fetch(SERVER_URL + '/employees', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    }); 
    if (res.ok) {
        const employees = await res.json();
        return employees;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error fetching employees');
    }
};

const getUnassignedEmployees = async () => {
    const res = await fetch(SERVER_URL + '/employees/unassigned', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });

    if (res.ok) {
        const employees = await res.json();
        return employees;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error fetching unassigned employees');
    }
};

const getTechnicalOfficers = async () => {
    const res = await fetch(SERVER_URL + '/employees/technical-officers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });

    if (res.ok) {
        const officers = await res.json();
        return officers;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error fetching technical officers');
    }
};

const assignEmployeeToOffice = async (employeeId, officeId, roleId) => {
    const res = await fetch(SERVER_URL + '/employees/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ employeeId, officeId, roleId })
    });

    if (res.ok) {
        return;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error assigning employee to office');
    }
};

const assignOfficerToOffice = async (officerId, officeId) => {
    const res = await fetch(SERVER_URL + `/employees/technical-officers/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ officerId, officeId })
    });
    if (res.ok) {
        return;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error assigning officer to office');
    }
};

const removeOfficerFromOffice = async (officerId, officeId) => {
    const res = await fetch(SERVER_URL + `/employees/technical-officers/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ officerId, officeId })
    }); 
    if (res.ok) {
        return;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error removing officer from office');
    }
};

const UserAPI = {
    getUserInfo,
    createNewEmployee,
    getUnassignedEmployees,
    getTechnicalOfficers,
    assignEmployeeToOffice,
    assignOfficerToOffice,
    removeOfficerFromOffice,
    updateProfile,
    deleteProfilePhoto
};

export default UserAPI;