const SERVER_URL = 'http://localhost:3001';

const deleteOfficeById = async (officeId) => {
    const res = await fetch(`${SERVER_URL}/offices/${officeId}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (!res.ok) {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error deleting office');
    }
};

const OfficeAPI = {
    deleteOfficeById
};

export default OfficeAPI;