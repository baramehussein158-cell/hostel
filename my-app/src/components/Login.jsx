import React, { useEffect, useState } from 'react';
import { FaChartLine, FaGraduationCap, FaShieldAlt } from 'react-icons/fa';
import heroImage from '../assets/hero.png';
import { GENDER_OPTIONS } from '../data/portalData';
import { useTheme } from '../contexts/ThemeContext';
import './Login.scss';

const HERO_SLIDES = [
  {
    eyebrow: 'Campus portal preview',
    title: 'One clean place for students and admin teams.',
    copy: 'Move between login, registration, password recovery, and room tracking with a polished motion sequence.',
    stat: '4 second slide cycle',
  },
  {
    eyebrow: 'Room visibility',
    title: 'Track capacity without guessing.',
    copy: 'The portal highlights UR and RP room totals, availability, and approvals so the admin sees the full picture.',
    stat: 'Live campus totals',
  },
  {
    eyebrow: 'Password control',
    title: 'Reset flows stay secure and organized.',
    copy: 'Students can request resets and admins can issue new passwords from the same workflow, all in one view.',
    stat: 'Student and admin access',
  },
];

const Login = ({
  onStudentLogin,
  onAdminLogin,
  onRegister,
  onPasswordResetRequest,
  onPasswordResetConfirm,
  registeredUsersCount,
  isSyncing,
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '', regNumber: '', campus: '', gender: '' });
  const [adminData, setAdminData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    regNumber: '',
    password: '',
    confirm: '',
    campus: '',
    gender: '',
    allowAdminUpdates: false,
  });
  const [resetRequestData, setResetRequestData] = useState({
    email: '',
    regNumber: '',
    campus: '',
    gender: '',
    reason: '',
  });
  const [resetCodeData, setResetCodeData] = useState({
    email: '',
    regNumber: '',
    campus: '',
    gender: '',
    resetCode: '',
    newPassword: '',
    confirm: '',
  });
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  const resetFeedback = () => setFeedback(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveHeroSlide((currentSlide) => (currentSlide + 1) % HERO_SLIDES.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

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
      !registerData.campus ||
      !registerData.gender ||
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
      gender: registerData.gender,
      allowAdminUpdates: registerData.allowAdminUpdates,
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
      campus: '',
      gender: '',
      allowAdminUpdates: false,
    });
    setLoginData((currentLogin) => ({
      ...currentLogin,
      email: registerData.email,
      regNumber: registerData.regNumber,
      campus: '',
      gender: '',
    }));
    setFeedback({ type: 'success', text: result.message });
  };

  const handlePasswordResetRequestSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (
      !resetRequestData.email ||
      !resetRequestData.regNumber ||
      !resetRequestData.campus ||
      !resetRequestData.gender
    ) {
      setFeedback({ type: 'error', text: 'Email, registration number, campus, and gender are required.' });
      return;
    }

    setIsSubmitting(true);
    const result = await onPasswordResetRequest(resetRequestData);
    setIsSubmitting(false);

    if (!result.success) {
      setFeedback({ type: 'error', text: result.message });
      return;
    }

    setResetRequestData({
      email: '',
      regNumber: '',
      campus: '',
      gender: '',
      reason: '',
    });
    setFeedback({ type: 'success', text: result.message });
  };

  const handlePasswordResetConfirmSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (
      !resetCodeData.email ||
      !resetCodeData.regNumber ||
      !resetCodeData.campus ||
      !resetCodeData.gender ||
      !resetCodeData.resetCode ||
      !resetCodeData.newPassword ||
      !resetCodeData.confirm
    ) {
      setFeedback({ type: 'error', text: 'All reset fields are required.' });
      return;
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPassword.test(resetCodeData.newPassword)) {
      setFeedback({
        type: 'error',
        text: 'New password must be at least 8 characters with uppercase, lowercase, number, and symbol.',
      });
      return;
    }

    if (resetCodeData.newPassword !== resetCodeData.confirm) {
      setFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    const result = await onPasswordResetConfirm(resetCodeData);
    setIsSubmitting(false);

    if (!result.success) {
      setFeedback({ type: 'error', text: result.message });
      return;
    }

    setResetCodeData({
      email: '',
      regNumber: '',
      campus: '',
      gender: '',
      resetCode: '',
      newPassword: '',
      confirm: '',
    });
    setMode('login');
    setFeedback({ type: 'success', text: result.message });
  };

  return (
    <div className={`login-container ${theme}`}>
      <div className="portal-grid">
        <section className="portal-hero">
          <div className="hero-copy">
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
          </div>

          <div className="hero-visual" aria-label="Campus portal highlights">
            <div className="hero-visual-frame">
              <div
                className="hero-visual-track"
                style={{ transform: `translate3d(-${activeHeroSlide * 100}%, 0, 0)` }}
              >
                {HERO_SLIDES.map((slide, index) => (
                  <article className="hero-visual-slide" key={slide.title}>
                    <img
                      src={heroImage}
                      alt=""
                      aria-hidden="true"
                      className={`hero-visual-image hero-visual-image-${index + 1}`}
                    />
                    <div className="hero-visual-overlay">
                      <span>{slide.stat}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="hero-visual-copy" aria-live="polite">
              <p className="hero-visual-eyebrow">{HERO_SLIDES[activeHeroSlide].eyebrow}</p>
              <h2>{HERO_SLIDES[activeHeroSlide].title}</h2>
              <p>{HERO_SLIDES[activeHeroSlide].copy}</p>
              <div className="hero-visual-dots" aria-label="Landing slide progress">
                {HERO_SLIDES.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    className={index === activeHeroSlide ? 'active' : ''}
                    onClick={() => setActiveHeroSlide(index)}
                    aria-label={`Show landing slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="login-card">
          <div className="login-nav four-column">
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
            <button
              className={mode === 'reset' ? 'active' : ''}
              type="button"
              onClick={() => {
                setMode('reset');
                resetFeedback();
              }}
            >
              Reset Password
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
                  : mode === 'admin'
                    ? 'Use the admin portal to review applicants and manage room inventory.'
                    : 'Request a one-time code from the admin or use an approved code to create a new password.'}
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
                      required
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
                <label htmlFor="student-gender-login">Gender (optional)</label>
                <select
                  id="student-gender-login"
                  value={loginData.gender}
                  onChange={(event) => setLoginData({ ...loginData, gender: event.target.value })}
                  disabled={isSubmitting || isSyncing}
                >
                  <option value="">Skip gender check</option>
                  {GENDER_OPTIONS.map((genderOption) => (
                    <option key={genderOption.value} value={genderOption.value}>
                      {genderOption.label}
                    </option>
                  ))}
                </select>
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
                      required
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
              <div className="form-group">
                <label htmlFor="register-gender">Gender</label>
                <select
                  id="register-gender"
                  value={registerData.gender}
                  onChange={(event) => setRegisterData({ ...registerData, gender: event.target.value })}
                  disabled={isSubmitting || isSyncing}
                  required
                >
                  <option value="">Select your gender</option>
                  {GENDER_OPTIONS.map((genderOption) => (
                    <option key={genderOption.value} value={genderOption.value}>
                      {genderOption.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="consent-card" htmlFor="register-allow-admin-updates">
                <input
                  type="checkbox"
                  id="register-allow-admin-updates"
                  checked={registerData.allowAdminUpdates}
                  onChange={(event) =>
                    setRegisterData({ ...registerData, allowAdminUpdates: event.target.checked })
                  }
                  disabled={isSubmitting || isSyncing}
                />
                <span>I allow the hostel admin to update my account details if something is wrong.</span>
              </label>
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

          {mode === 'reset' && (
            <div className="reset-mode">
              <form onSubmit={handlePasswordResetRequestSubmit} className="reset-card">
                <h3>Request one-time code</h3>
                <p>Send a password reset request to the admin. Gender is required so the admin can identify you.</p>

                <div className="form-group">
                  <label htmlFor="reset-request-email">Email</label>
                  <input
                    type="email"
                    id="reset-request-email"
                    value={resetRequestData.email}
                    onChange={(event) => setResetRequestData({ ...resetRequestData, email: event.target.value })}
                    placeholder="student@university.edu"
                    disabled={isSubmitting || isSyncing}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reset-request-regNumber">Registration Number</label>
                  <input
                    type="text"
                    id="reset-request-regNumber"
                    value={resetRequestData.regNumber}
                    onChange={(event) => setResetRequestData({ ...resetRequestData, regNumber: event.target.value })}
                    placeholder="Enter your reg number"
                    disabled={isSubmitting || isSyncing}
                  />
                </div>
                <div className="form-group campus-choice">
                  <label>Campus</label>
                  <div className="campus-options">
                    <label>
                      <input
                        type="radio"
                        name="resetRequestCampus"
                        value="UR"
                        required
                        checked={resetRequestData.campus === 'UR'}
                        onChange={(event) => setResetRequestData({ ...resetRequestData, campus: event.target.value })}
                        disabled={isSubmitting || isSyncing}
                      />
                      UR
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="resetRequestCampus"
                        value="RP"
                        checked={resetRequestData.campus === 'RP'}
                        onChange={(event) => setResetRequestData({ ...resetRequestData, campus: event.target.value })}
                        disabled={isSubmitting || isSyncing}
                      />
                      RP
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="reset-request-gender">Gender</label>
                  <select
                    id="reset-request-gender"
                    value={resetRequestData.gender}
                    onChange={(event) => setResetRequestData({ ...resetRequestData, gender: event.target.value })}
                    disabled={isSubmitting || isSyncing}
                    required
                  >
                    <option value="">Select your gender</option>
                    {GENDER_OPTIONS.map((genderOption) => (
                      <option key={genderOption.value} value={genderOption.value}>
                        {genderOption.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reset-request-reason">Reason</label>
                  <textarea
                    id="reset-request-reason"
                    value={resetRequestData.reason}
                    onChange={(event) => setResetRequestData({ ...resetRequestData, reason: event.target.value })}
                    placeholder="Optional note for the admin"
                    rows="3"
                    disabled={isSubmitting || isSyncing}
                  />
                </div>

                <button type="submit" className="login-btn" disabled={isSubmitting || isSyncing}>
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </form>

              <form onSubmit={handlePasswordResetConfirmSubmit} className="reset-card">
                <h3>Use reset code</h3>
                <p>After the admin approves your request, enter the code once and set a new strong password.</p>

                <div className="form-group">
                  <label htmlFor="reset-confirm-email">Email</label>
                  <input
                    type="email"
                    id="reset-confirm-email"
                    value={resetCodeData.email}
                    onChange={(event) => setResetCodeData({ ...resetCodeData, email: event.target.value })}
                    placeholder="student@university.edu"
                    disabled={isSubmitting || isSyncing}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reset-confirm-regNumber">Registration Number</label>
                  <input
                    type="text"
                    id="reset-confirm-regNumber"
                    value={resetCodeData.regNumber}
                    onChange={(event) => setResetCodeData({ ...resetCodeData, regNumber: event.target.value })}
                    placeholder="Enter your reg number"
                    disabled={isSubmitting || isSyncing}
                  />
                </div>
                <div className="form-group campus-choice">
                  <label>Campus</label>
                  <div className="campus-options">
                    <label>
                      <input
                        type="radio"
                        name="resetConfirmCampus"
                        value="UR"
                        required
                        checked={resetCodeData.campus === 'UR'}
                        onChange={(event) => setResetCodeData({ ...resetCodeData, campus: event.target.value })}
                        disabled={isSubmitting || isSyncing}
                      />
                      UR
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="resetConfirmCampus"
                        value="RP"
                        checked={resetCodeData.campus === 'RP'}
                        onChange={(event) => setResetCodeData({ ...resetCodeData, campus: event.target.value })}
                        disabled={isSubmitting || isSyncing}
                      />
                      RP
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="reset-confirm-gender">Gender</label>
                  <select
                    id="reset-confirm-gender"
                    value={resetCodeData.gender}
                    onChange={(event) => setResetCodeData({ ...resetCodeData, gender: event.target.value })}
                    disabled={isSubmitting || isSyncing}
                    required
                  >
                    <option value="">Select your gender</option>
                    {GENDER_OPTIONS.map((genderOption) => (
                      <option key={genderOption.value} value={genderOption.value}>
                        {genderOption.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reset-code">One-time Code</label>
                  <input
                    type="text"
                    id="reset-code"
                    value={resetCodeData.resetCode}
                    onChange={(event) => setResetCodeData({ ...resetCodeData, resetCode: event.target.value })}
                    placeholder="Enter code from admin"
                    disabled={isSubmitting || isSyncing}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reset-new-password">New Password</label>
                    <input
                      type="password"
                      id="reset-new-password"
                      value={resetCodeData.newPassword}
                      onChange={(event) => setResetCodeData({ ...resetCodeData, newPassword: event.target.value })}
                      placeholder="Create a new password"
                      disabled={isSubmitting || isSyncing}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reset-confirm-password">Confirm Password</label>
                    <input
                      type="password"
                      id="reset-confirm-password"
                      value={resetCodeData.confirm}
                      onChange={(event) => setResetCodeData({ ...resetCodeData, confirm: event.target.value })}
                      placeholder="Confirm new password"
                      disabled={isSubmitting || isSyncing}
                    />
                  </div>
                </div>

                <button type="submit" className="login-btn" disabled={isSubmitting || isSyncing}>
                  {isSubmitting ? 'Updating...' : 'Set New Password'}
                </button>
              </form>
            </div>
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
            {mode === 'reset' && (
              <p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    resetFeedback();
                  }}
                >
                  Back to login
                </button>
              </p>
            )}
            {mode === 'admin' && (
              <p>
                Need help from the reset tab?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    resetFeedback();
                  }}
                >
                  Open reset password
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
