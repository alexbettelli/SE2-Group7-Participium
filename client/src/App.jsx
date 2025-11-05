import './App.css'
import {Routes, Route} from 'react-router';
import { useEffect, useState } from 'react'
import API from './api/API.mjs'
import AuthenticateForm from './components/Authentication';
import NotFound from './components/NotFound';
import DefaultLayout from './components/DefaultLayout';


function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({});  

  useEffect(() => {
      API.getUserInfo()
      .then((user) => {
          setLoggedIn(true);
          setUser(user);
        }) 
      .catch(  e => {
        setLoggedIn(false);
        setUser(null);
        });
    }, []);

  const handleLogin = async(credentials) => {
    try {
      const user = await API.login(credentials);
      setLoggedIn(true);
      setUser(user);
    } catch (error) {
      console.log(error);
    }
  }
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false); 
  };

  return (
    <Routes>
      <Route element={<DefaultLayout />}>     
        <Route path="/" index element={<AuthenticateForm handleLogin={handleLogin} />}/>                 
        <Route path="*" element={<NotFound />}/>
      </Route>
    </Routes>
  )
}

export default App
