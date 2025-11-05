import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/TempHome.jsx';
import { ReportOverviewPage } from './pages/ReportOverviewPage.jsx';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="/report-overview" element={<ReportOverviewPage />} />
      </Routes>
    </div>
  );
}

export default App;
