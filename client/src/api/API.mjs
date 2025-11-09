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

const API = {login, registrate, getUserInfo, logOut, submitReport }
export default API;