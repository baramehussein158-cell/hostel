import React, { useState } from 'react';
import { FaGraduationCap, FaShieldAlt, FaRocket } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import './Login.scss';

const Login = ({ onLogin, onRegister, registeredUser }) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '', regNumber: '', campus: 'UR' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', regNumber: '', password: '', confirm: '', campus: 'UR' });
  const [error, setError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!loginData.email || !loginData.password || !loginData.regNumber || !loginData.campus) {
      setError('Email, password, registration number, and campus selection are required to login.');
      return;
    }

    const result = onLogin(loginData);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!registerData.name || !registerData.email || !registerData.regNumber || !registerData.password || !registerData.confirm) {
      setError('All registration fields are required.');
      return;
    }

    const regNumberPattern = /^[A-Za-z0-9]{4,12}$/;
    if (!regNumberPattern.test(registerData.regNumber)) {
      setError('Registration number must be 4–12 alphanumeric characters.');
      return;
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPassword.test(registerData.password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, numeric, and symbol characters.');
      return;
    }

    if (registerData.password !== registerData.confirm) {
      setError('Passwords do not match.');
      return;
    }

    onRegister({
      name: registerData.name,
      email: registerData.email,
      regNumber: registerData.regNumber,
      password: registerData.password,
      campus: registerData.campus,
    });

    // Switch back to login mode after registration
    setMode('login');
    setError('');
  };

  return (
    <div className={`login-container ${theme}`}>
      <div className="portal-grid">
        <section className="portal-hero">
          <div className="hero-pill">Student Portal</div>
          <h1>Apply for your hostel room with confidence.</h1>
          <p>CampusStay helps you manage your application, view your status, and keep your profile ready for room allocation.</p>

          <div className="hero-features">
            <div>
              <FaGraduationCap />
              <span>Student-first experience</span>
            </div>
            <div>
              <FaShieldAlt />
              <span>Secure personal profile</span>
            </div>
            <div>
              <FaRocket />
              <span>Fast application workflow</span>
            </div>
          </div>
        </section>

        <div className="login-card">
          <div className="login-nav">
            <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => { setMode('login'); setError(''); }}>
              Login
            </button>
            <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => { setMode('register'); setError(''); }}>
              Register
            </button>
          </div>

          <div className="login-intro">
            <h2>{mode === 'login' ? 'Student Login' : 'Create Your Profile'}</h2>
            <p>{mode === 'login' ? 'Sign in to access your hostel application dashboard.' : 'Register now to reserve and manage your hostel room application.'}</p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="student@university.edu"
                />
              </div>
              <div className="form-group">
                <label htmlFor="regNumber">Registration Number</label>
                <input
                  type="text"
                  id="regNumber"
                  value={loginData.regNumber}
                  onChange={(e) => setLoginData({ ...loginData, regNumber: e.target.value })}
                  placeholder="Enter your reg number"
                />
              </div>
              <div className="form-group campus-choice">
                <label>Campus</label>
                <div className="campus-options">
                  <label>
                    <input
                      type="radio"
                      name="campusLogin"
                      value="UR"
                      checked={loginData.campus === 'UR'}
                      onChange={(e) => setLoginData({ ...loginData, campus: e.target.value })}
                    />
                    UR
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="campusLogin"
                      value="RP"
                      checked={loginData.campus === 'RP'}
                      onChange={(e) => setLoginData({ ...loginData, campus: e.target.value })}
                    />
                    RP
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Enter your password"
                />
              </div>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="login-btn">Login</button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  placeholder="student@university.edu"
                />
              </div>
              <div className="form-group">
                <label htmlFor="regNumber">Registration Number</label>
                <input
                  type="text"
                  id="regNumber"
                  value={registerData.regNumber}
                  onChange={(e) => setRegisterData({ ...registerData, regNumber: e.target.value })}
                  placeholder="Enter a reg number"
                />
              </div>
              <div className="form-group campus-choice">
                <label>Campus</label>
                <div className="campus-options">
                  <label>
                    <input
                      type="radio"
                      name="campusRegister"
                      value="UR"
                      checked={registerData.campus === 'UR'}
                      onChange={(e) => setRegisterData({ ...registerData, campus: e.target.value })}
                    />
                    UR
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="campusRegister"
                      value="RP"
                      checked={registerData.campus === 'RP'}
                      onChange={(e) => setRegisterData({ ...registerData, campus: e.target.value })}
                    />
                    RP
                  </label>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Create a password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm">Confirm Password</label>
                  <input
                    type="password"
                    id="confirm"
                    value={registerData.confirm}
                    onChange={(e) => setRegisterData({ ...registerData, confirm: e.target.value })}
                    placeholder="Confirm password"
                  />
                </div>
              </div>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="login-btn">Register Account</button>
            </form>
          )}

          <div className="signup-link">
            {mode === 'login' ? (
              <p>
                New student? <button type="button" onClick={() => { setMode('register'); setError(''); }}>Create account</button>
              </p>
            ) : (
              <p>
                Already registered? <button type="button" onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;