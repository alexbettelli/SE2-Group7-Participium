import './App.css'
import {Routes, Route, Navigate} from 'react-router';
import { useEffect, useState } from 'react'
import API from './api/API.mjs'
import AuthenticateForm from './components/Authentication';
import NotFound from './components/NotFound';
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage';


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
        <Route path="/" index element={loggedIn? <Navigate to="/home" replace/> : <AuthenticateForm handleLogin={handleLogin} />}/> 
        <Route path="/home" element={<HomePage user={user}/>} />  
       <Route path="/report-overview" element={<ReportOverviewPage />} />              
        <Route path="*" element={<NotFound />}/>
      </Route>
    </Routes>
  )
}

export default App;
