import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SubmitReport from './pages/SubmitReport';
import Tracking from './pages/Tracking';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/submit" element={<SubmitReport />} />
          <Route path="/track" element={<Tracking />} />
          <Route path="/track/:reportId" element={<Tracking />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
