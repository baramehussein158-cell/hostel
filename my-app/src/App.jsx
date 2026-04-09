import React, { useState } from 'react';
import { FaGraduationCap } from 'react-icons/fa';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import './App.scss';

function AppContent() {
  const { theme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [student, setStudent] = useState({ name: 'Student', email: '', campus: 'UR' });
  const [registeredUser, setRegisteredUser] = useState(() => {
    const saved = localStorage.getItem('registeredUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [appliedCount, setAppliedCount] = useState(0);
  const [applicationData, setApplicationData] = useState(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const totalRooms = 214;
  const deadline = new Date('2026-05-15T23:59:59');
  const now = new Date();
  const pastDeadline = now > deadline;
  const remainingRooms = Math.max(totalRooms - appliedCount, 0);
  const roomClosed = pastDeadline || remainingRooms <= 0;

  const handleLogin = (credentials) => {
    if (!registeredUser) {
      return { success: false, message: 'No account found. Please register first.' };
    }

    if (
      credentials.email.toLowerCase() === registeredUser.email.toLowerCase() &&
      credentials.password === registeredUser.password &&
      credentials.regNumber === registeredUser.regNumber &&
      credentials.campus === registeredUser.campus
    ) {
      setStudent({ name: registeredUser.name, email: registeredUser.email, campus: credentials.campus });
      setIsLoggedIn(true);
      return { success: true };
    }

    return { success: false, message: 'Invalid credentials. Please check your details.' };
  };

  const handleRegister = (user) => {
    setRegisteredUser(user);
    localStorage.setItem('registeredUser', JSON.stringify(user));
    // Do not set isLoggedIn here; let user login after registration
  };

  const handleRoomApplication = (data) => {
    if (!roomClosed && !applicationSubmitted) {
      setAppliedCount((count) => count + 1);
      setApplicationData(data);
      setApplicationSubmitted(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className={`app ${theme}`}>
      <header className="site-header">
        <div className="header-content">
          <div className="header-logos">
            {isLoggedIn && student.campus === 'UR' && (
              <div className="campus-symbol ur-symbol">
                <FaGraduationCap />
                <span>UR</span>
              </div>
            )}
            {isLoggedIn && student.campus === 'RP' && (
              <div className="campus-symbol rp-symbol">
                <FaGraduationCap />
                <span>RP</span>
              </div>
            )}
            {!isLoggedIn && (
              <>
                <div className="campus-symbol ur-symbol">
                  <FaGraduationCap />
                  <span>UR</span>
                </div>
                <div className="campus-symbol rp-symbol">
                  <FaGraduationCap />
                  <span>RP</span>
                </div>
              </>
            )}
          </div>
          <h1 className="site-title">CampusStay Portal</h1>
          <p className="site-subtitle">
            {isLoggedIn ? `${student.campus === 'RP' ? 'Rwanda Polytechnic' : 'University of Rwanda'} Student Dashboard` : 'Secure Hostel Application System'}
          </p>
        </div>
      </header>
      {isLoggedIn ? (
        <Dashboard
          onLogout={handleLogout}
          student={student}
          campus={student.campus}
          totalRooms={totalRooms}
          appliedCount={appliedCount}
          remainingRooms={remainingRooms}
          roomClosed={roomClosed}
          pastDeadline={pastDeadline}
          deadline={deadline}
          applicationSubmitted={applicationSubmitted}
          applicationData={applicationData}
          onRoomApplication={handleRoomApplication}
        />
      ) : (
        <Login onLogin={handleLogin} onRegister={handleRegister} registeredUser={registeredUser} />
      )}
      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <strong>POWER BY HUSSEIN BARAME</strong>
            <p>Professional student hostel application portal for UR and RP campus communities.</p>
          </div>
          <div className="footer-contact">
            <h4>Contact</h4>
            <p>Email: <a href="mailto:baramehussein@158gmail.com">baramehussein@158gmail.com</a></p>
            <p>Phone: +250 788 123 456</p>
            <p>Location: Kigali, Rwanda</p>
          </div>
          <div className="footer-links">
            <h4>Quick links</h4>
            <p>Home</p>
            <p>Student login</p>
            <p>Hostel application</p>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 POWER BY HUSSEIN BARAME. All rights reserved. Crafted for secure campus housing application experiences.
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
