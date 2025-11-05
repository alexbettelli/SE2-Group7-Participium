import './App.css'
import {Routes, Route} from 'react-router';
import AuthenticateForm from './components/Authentication';
import NotFound from './components/NotFound';
import DefaultLayout from './components/DefaultLayout';


function App() {

  return (
    <Routes>
      <Route element={<DefaultLayout />}>     
        <Route path="/" index element={<AuthenticateForm/>}/>                 
        <Route path="*" element={<NotFound />}/>
      </Route>
    </Routes>
  )
}

export default App
