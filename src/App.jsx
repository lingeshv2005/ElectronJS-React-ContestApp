import { Route, Routes } from 'react-router-dom';
import MyContestPage from './components/MyContestPage';
import ContestPage from './components/ContestPage';
import ProblemPage from './components/ProblemPage';
import Login from './components/Login';
import './App.css';
import ProtectedRoute from './ProtectedRoute';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute element={<MyContestPage />} />} />
      <Route path="/:contestId" element={<ProtectedRoute element={<ContestPage />} />} />
      <Route path="/:contestId/:problemId" element={<ProtectedRoute element={<ProblemPage />} />} />
    </Routes>
  );
};

export default App;
