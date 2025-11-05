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
const API = {login, registrate, getUserInfo, logOut }
export default API;