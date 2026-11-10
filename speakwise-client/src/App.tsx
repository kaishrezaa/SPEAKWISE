import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Progress from './pages/Progress';
import SessionReport from './pages/SessionReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="practice" element={<Practice />} />
          <Route path="progress" element={<Progress />} />
          <Route path="session/:id" element={<SessionReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
