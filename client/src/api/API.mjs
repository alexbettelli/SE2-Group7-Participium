const SERVER_URL = 'http://localhost:3001';

const login = async(credentials) => {
    const response = await fetch(SERVER_URL + '/session', {
        method : 'POST',
        headers : { 'Content-Type' : 'application/json' },
        credentials : 'include',
        body : JSON.stringify(credentials)
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
          const errDetails = await res.json();
          if (errDetails.error.includes('user.email')){
              throw new Error('This email is already in use!');
          }
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
  formData.append('anonymous', reportData.anonymous ? 'true' : 'false');
  
  reportData.images.forEach(image => {
    formData.append('images', image);
  });

  const res = await fetch(SERVER_URL + '/users/reports', {
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

const getMyReports = async () => {
    const res = await fetch(SERVER_URL + '/users/myreports', {
        method: 'GET',
        credentials: 'include'
    });
    if (res.ok) {
        const reports = await res.json();
        console.log(reports);
        return reports;
    } else {
        const errDetails = await res.json();
        throw new Error(errDetails.error || 'Error fetching user reports');
    }
};

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

const updateProfile = async (formData)=> {
    try{
        const res = await fetch(SERVER_URL + '/api/user/profile', {
            method: 'PUT',
            credentials: 'include',
            body: formData
        });

        if (!res.ok){
            const errMessage = await res.json();
            throw new Error (errMessage.error || 'Error updating profile');
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



/*

export const getReportChatMessages = async (reportId) => {
    const res = await fetch(`${SERVER_URL}/reports/${reportId}/chat`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (res.ok) {
        return await res.json();
    } else {
        const errDetails = await res.json();
        throw new Error(errDetails.message || 'Error fetching report messages');
    }
};

*/

const submitNotification = async (notificationData) => {
  const res = await fetch(SERVER_URL + '/notifications', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(notificationData)
  });

  if (res.ok) {
    return await res.json();
  } else {
    const errDetails = await res.json();
    throw new Error(errDetails.message || 'Error submitting notification');
  }
};

const setReadNotifications = async (reportId) => {
    const res = await fetch(SERVER_URL + '/notifications/read', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({reportId})
    });
    if (res.ok) {
        const data = await res.json();
        return data.readNotifications;
    } else {
        const errDetails = await res.json();
        throw new Error(errDetails.error || 'Error setting notifications as read');
    }
};


const API = {login, registrate, createNewEmployee, getUnassignedEmployees, getOffices, getRoles, assignEmployeeToOffice, getUserInfo, submitReport, logOut, getCategories, getMyReports, updateProfile, deleteProfilePhoto, submitNotification, setReadNotifications };
export default API;