import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import WorkspacePage from './pages/WorkspacePage';
import DataRegistrationPage from './pages/DataRegistrationPage';
import SystemAdminPage from './pages/SystemAdminPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Default route redirects to workspace */}
          <Route index element={<WorkspacePage />} />
          <Route path="workspace" element={<WorkspacePage />} />
          <Route path="data-registration" element={<DataRegistrationPage />} />
          <Route path="system-admin" element={<SystemAdminPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
