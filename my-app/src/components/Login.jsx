import React, { useState } from 'react';
import { FaChartLine, FaGraduationCap, FaShieldAlt } from 'react-icons/fa';
import { ADMIN_ACCOUNT } from '../data/portalData';
import { useTheme } from '../contexts/ThemeContext';
import './Login.scss';

const Login = ({ onStudentLogin, onAdminLogin, onRegister, registeredUsersCount, isSyncing }) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '', regNumber: '', campus: 'UR' });
  const [adminData, setAdminData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    regNumber: '',
    password: '',
    confirm: '',
    campus: 'UR',
  });
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetFeedback = () => setFeedback(null);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (!loginData.email || !loginData.password || !loginData.regNumber || !loginData.campus) {
      setFeedback({
        type: 'error',
        text: 'Email, password, registration number, and campus are required.',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await onStudentLogin(loginData);
    setIsSubmitting(false);
    if (!result.success) {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  const handleAdminSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (!adminData.email || !adminData.password) {
      setFeedback({ type: 'error', text: 'Admin email and password are required.' });
      return;
    }

    setIsSubmitting(true);
    const result = await onAdminLogin(adminData);
    setIsSubmitting(false);
    if (!result.success) {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (
      !registerData.name ||
      !registerData.email ||
      !registerData.regNumber ||
      !registerData.password ||
      !registerData.confirm
    ) {
      setFeedback({ type: 'error', text: 'All registration fields are required.' });
      return;
    }

    const regNumberPattern = /^[A-Za-z0-9]{4,12}$/;
    if (!regNumberPattern.test(registerData.regNumber)) {
      setFeedback({
        type: 'error',
        text: 'Registration number must be 4-12 alphanumeric characters.',
      });
      return;
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPassword.test(registerData.password)) {
      setFeedback({
        type: 'error',
        text: 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol.',
      });
      return;
    }

    if (registerData.password !== registerData.confirm) {
      setFeedback({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    const result = await onRegister({
      name: registerData.name,
      email: registerData.email,
      regNumber: registerData.regNumber,
      password: registerData.password,
      campus: registerData.campus,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setFeedback({ type: 'error', text: result.message });
      return;
    }

    setMode('login');
    setRegisterData({
      name: '',
      email: '',
      regNumber: '',
      password: '',
      confirm: '',
      campus: 'UR',
    });
    setLoginData((currentLogin) => ({
      ...currentLogin,
      email: registerData.email,
      regNumber: registerData.regNumber,
      campus: registerData.campus,
    }));
    setFeedback({ type: 'success', text: result.message });
  };

  return (
    <div className={`login-container ${theme}`}>
      <div className="portal-grid">
        <section className="portal-hero">
          <div className="hero-pill">Student and Admin Portal</div>
          <h1>Apply, review, and monitor campus housing from one portal.</h1>
          <p>
            Students can register and apply for rooms, while administrators can monitor reports, manage room
            capacity, and review applicants.
          </p>

          <div className="hero-features">
            <div>
              <FaGraduationCap />
              <span>{registeredUsersCount} student account(s) registered</span>
            </div>
            <div>
              <FaShieldAlt />
              <span>Secure student and admin login flows</span>
            </div>
            <div>
              <FaChartLine />
              <span>Live room and applicant monitoring logic</span>
            </div>
          </div>
        </section>

        <div className="login-card">
          <div className="login-nav three-column">
            <button
              className={mode === 'login' ? 'active' : ''}
              type="button"
              onClick={() => {
                setMode('login');
                resetFeedback();
              }}
            >
              Student Login
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              type="button"
              onClick={() => {
                setMode('register');
                resetFeedback();
              }}
            >
              Register
            </button>
            <button
              className={mode === 'admin' ? 'active' : ''}
              type="button"
              onClick={() => {
                setMode('admin');
                resetFeedback();
              }}
            >
              Admin
            </button>
          </div>

          <div className="login-intro">
            <h2>
              {mode === 'login'
                ? 'Student Login'
                : mode === 'register'
                  ? 'Create Student Profile'
                  : 'Admin Monitor Login'}
            </h2>
            <p>
              {mode === 'login'
                ? 'Sign in to apply for a room or track your latest application.'
                : mode === 'register'
                  ? 'Register a student account before submitting a hostel room request.'
                  : 'Use the admin portal to review applicants and manage room inventory.'}
            </p>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="student-email">Email</label>
                <input
                  type="email"
                  id="student-email"
                  value={loginData.email}
                  onChange={(event) => setLoginData({ ...loginData, email: event.target.value })}
                  placeholder="student@university.edu"
                />
              </div>
              <div className="form-group">
                <label htmlFor="student-regNumber">Registration Number</label>
                <input
                  type="text"
                  id="student-regNumber"
                  value={loginData.regNumber}
                  onChange={(event) => setLoginData({ ...loginData, regNumber: event.target.value })}
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
                      onChange={(event) => setLoginData({ ...loginData, campus: event.target.value })}
                    />
                    UR
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="campusLogin"
                      value="RP"
                      checked={loginData.campus === 'RP'}
                      onChange={(event) => setLoginData({ ...loginData, campus: event.target.value })}
                    />
                    RP
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="student-password">Password</label>
                <input
                  type="password"
                  id="student-password"
                  value={loginData.password}
                  onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                  placeholder="Enter your password"
                  disabled={isSubmitting || isSyncing}
                />
              </div>
              {feedback && <p className={`message ${feedback.type}`}>{feedback.text}</p>}
              {isSyncing && <p className="message sync">Connecting data...</p>}
              <button type="submit" className="login-btn" disabled={isSubmitting || isSyncing}>
                {isSubmitting ? 'Please wait...' : 'Login'}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label htmlFor="register-name">Full Name</label>
                <input
                  type="text"
                  id="register-name"
                  value={registerData.name}
                  onChange={(event) => setRegisterData({ ...registerData, name: event.target.value })}
                  placeholder="Enter your full name"
                  disabled={isSubmitting || isSyncing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="register-email">Email</label>
                <input
                  type="email"
                  id="register-email"
                  value={registerData.email}
                  onChange={(event) => setRegisterData({ ...registerData, email: event.target.value })}
                  placeholder="student@university.edu"
                  disabled={isSubmitting || isSyncing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="register-regNumber">Registration Number</label>
                <input
                  type="text"
                  id="register-regNumber"
                  value={registerData.regNumber}
                  onChange={(event) => setRegisterData({ ...registerData, regNumber: event.target.value })}
                  placeholder="Enter a reg number"
                  disabled={isSubmitting || isSyncing}
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
                      onChange={(event) => setRegisterData({ ...registerData, campus: event.target.value })}
                      disabled={isSubmitting || isSyncing}
                    />
                    UR
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="campusRegister"
                      value="RP"
                      checked={registerData.campus === 'RP'}
                      onChange={(event) => setRegisterData({ ...registerData, campus: event.target.value })}
                      disabled={isSubmitting || isSyncing}
                    />
                    RP
                  </label>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="register-password">Password</label>
                  <input
                    type="password"
                    id="register-password"
                    value={registerData.password}
                    onChange={(event) => setRegisterData({ ...registerData, password: event.target.value })}
                    placeholder="Create a password"
                    disabled={isSubmitting || isSyncing}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="register-confirm">Confirm Password</label>
                  <input
                    type="password"
                    id="register-confirm"
                    value={registerData.confirm}
                    onChange={(event) => setRegisterData({ ...registerData, confirm: event.target.value })}
                    placeholder="Confirm password"
                    disabled={isSubmitting || isSyncing}
                  />
                </div>
              </div>
              {feedback && <p className={`message ${feedback.type}`}>{feedback.text}</p>}
              {isSyncing && <p className="message sync">Connecting data...</p>}
              <button type="submit" className="login-btn" disabled={isSubmitting || isSyncing}>
                {isSubmitting ? 'Please wait...' : 'Register Account'}
              </button>
            </form>
          )}

          {mode === 'admin' && (
            <form onSubmit={handleAdminSubmit}>
              <div className="form-group">
                <label htmlFor="admin-email">Admin Email</label>
                <input
                  type="email"
                  id="admin-email"
                  value={adminData.email}
                  onChange={(event) => setAdminData({ ...adminData, email: event.target.value })}
                  placeholder="admin@campusstay.rw"
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="admin-password">Password</label>
                <input
                  type="password"
                  id="admin-password"
                  value={adminData.password}
                  onChange={(event) => setAdminData({ ...adminData, password: event.target.value })}
                  placeholder="Enter admin password"
                  disabled={isSubmitting}
                />
              </div>
              {/* <div className="credentials-hint">
                <strong>Demo admin credentials</strong>
                <span>{ADMIN_ACCOUNT.email}</span>
                <span>{ADMIN_ACCOUNT.password}</span>
              </div> */}
              {feedback && <p className={`message ${feedback.type}`}>{feedback.text}</p>}
              <button type="submit" className="login-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait...' : 'Open Admin Portal'}
              </button>
            </form>
          )}

          <div className="signup-link">
            {mode === 'login' && (
              <p>
                New student?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    resetFeedback();
                  }}
                >
                  Create account
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    resetFeedback();
                  }}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
