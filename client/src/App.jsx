import './App.css'
import { Routes, Route, Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import LoggingAPI from './api/LoggingAPI.mjs';
import UserAPI from './api/UserAPI.mjs'
import AuthenticateForm from './components/Authentication';
import NotFound from './components/NotFound';
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage';
import ReportOverviewPage from './components/ReportOverviewPage.jsx';
import MyReportsPage from './components/MyReportsPage.jsx';
import ChatPage from './components/ChatPage.jsx';
import ProfilePage from './components/ProfilePage';


function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({});
  const [loginError, setLoginError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(null);

  useEffect(() => {
    UserAPI.getUserInfo()
      .then((user) => {
        setLoggedIn(true);
        setUser(user);
      })
      .catch(e => {
        setLoggedIn(false);
        setUser(null);
      });
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await LoggingAPI.login(credentials);
      setLoggedIn(true);
      setUser(user);
      setLoginError("");
    } catch (error) {
      setLoginError(error.message || "Login failed");
    }
  }
  const handleLogout = async () => {
    await LoggingAPI.logOut();
    setLoggedIn(false);
    setUser(null);
  };

  return (
    <Routes>
      <Route element={<DefaultLayout user={user} handleLogout={handleLogout} unreadNotifications={unreadNotifications} setUnreadNotifications={setUnreadNotifications} />}>
        <Route path="/" index element={loggedIn ? <HomePage user={user} setSelectedReport={setSelectedReport} /> : <AuthenticateForm handleLogin={handleLogin} loginError={loginError} />} />
        <Route path="/report-overview" element={loggedIn ? <ReportOverviewPage user={user} /> : <Navigate to="/" />} />
        <Route path="/profile" element={user && user.role?.id === 1 ? (<ProfilePage user={user} setUser={setUser} />) : (<Navigate to="/" replace />)} />
        <Route path="/myreports" element={loggedIn ? <MyReportsPage user={user} setSelectedReport={setSelectedReport} /> : <Navigate to="/" />} />
        <Route path="/chat" element={loggedIn ? <ChatPage user={user} report={selectedReport} unreadNotifications={unreadNotifications} setUnreadNotifications={setUnreadNotifications} /> : <Navigate to="/" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App;
