const SERVER_URL = 'http://localhost:3001';

const login = async(credentials) => {
    const res = await fetch(SERVER_URL + '/session', {
        method : 'POST',
        headers : { 'Content-Type' : 'application/json' },
        credentials : 'include',
        body : JSON.stringify(credentials)
    })

    if (res.ok) {        
        const user = await res.json();
        return user;
    } else {        
        const errDetails = await res.text();
        throw new Error(errDetails.message || 'Username or Password incorrect!');
    }
};
const registrate = async(data) =>{
     const res = await fetch(SERVER_URL + '/user', {
        method : 'POST',
        headers : { 'Content-Type' : 'application/json' },
        body : JSON.stringify(data)
    })

    if (res.ok) {        
        const user = await res.json();
        return user;
    } else {        
        const errDetails = await res.text();
        throw new Error(errDetails.message || 'Error:user not saved!');
    }
}

const createNewEmployee = async(data) => {
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
          const errDetails = await res.text();
          throw new Error(errDetails.error || 'Error: employee not created!');
      }
}

const getUserInfo = async() =>{
    const res = await fetch(SERVER_URL+'/session/current',{
        credentials : 'include'
    });
    const user = await res.json();
    if (res.ok) {   
        return user;
    } else {    
        throw null;
    }
};

const getUnassignedEmployees = async() => {
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

const logOut = async() => {
  const response = await fetch(SERVER_URL + '/sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
  if (response.ok)
    return null;
};

const submitReport = async(reportData) => {
  const formData = new FormData();
  formData.append('title', reportData.title);
  formData.append('description', reportData.description);
  formData.append('latitude', reportData.latitude);
  formData.append('longitude', reportData.longitude);
  formData.append('address', reportData.address);
  formData.append('catId', reportData.catId);
  
  reportData.images.forEach(image => {
    formData.append('images', image);
  });

  const res = await fetch(SERVER_URL + '/reports', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });

  if (res.ok) {
    const data = await res.json();
    return data;
  } else {
    const errDetails = await res.json();
    throw new Error(errDetails.message || 'Error submitting report');
  }
};

const API = {login, registrate, createNewEmployee, getUnassignedEmployees, getOffices, getRoles, assignEmployeeToOffice, getUserInfo, submitReport, logOut };
export default API;