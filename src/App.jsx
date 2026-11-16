
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StartDebate from './pages/StartDebate';
import Profile from './pages/Profile';
import DebateRoom from './pages/DebateRoom';
import MyDebates from './pages/MyDebates';


function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar
                  title="Home"
                  subtitle="Your personal debate space"
                />
                <Home />
              </>
            }
          />

          <Route
            path="/start-debate"
            element={
              <>
                <Navbar
                  title="Start Debate"
                  subtitle="Challenge yourself with a new topic"
                />
                <StartDebate />
              </>
            }
          />

          <Route
            path="/my-debates"
            element={
              <>
                <Navbar
                  title="My Debates"
                  subtitle="Explore your debate history"
                />
                <MyDebates />
              </>
            }
          />

          <Route
            path="/profile"
            element={
              <>
                <Navbar
                  title="My Profile"
                  subtitle="Your account and performance records"
                />
                <Profile />
              </>
            }
          />

          <Route
            path="/debate-room"
            element={
              <>
                <Navbar
                  title="Debate Room"
                  subtitle="Put your reasoning to the test"
                />
                <DebateRoom />
              </>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
