import React, { useState } from 'react';
import {
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaLock,
  FaIdCard,
  FaMapMarkerAlt,
  FaVenusMars,
} from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import './StudentLogin.scss';

const StudentLogin = ({
  onStudentLogin,
  onRegister,
  onPasswordResetRequest,
  onPasswordResetConfirm,
  onBack,
  isSyncing,
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState('login');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const STUDY_CAMPUSES = {
    UR: ['College of Business and Economics', 'College of Science and Technology', 'College of Medicine and Health Sciences'],
    RP: ['Engineering', 'Business', 'Information Technology'],
  };

  const [formData, setFormData] = useState({
    // Login fields
    email: '',
    password: '',
    regNumber: '',
    campus: '',
    gender: '',
    // Register fields
    name: '',
    confirmPassword: '',
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setMessage('');
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password || !formData.regNumber || !formData.campus) {
      setMessage('Please fill in all login fields');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onStudentLogin({
        email: formData.email,
        password: formData.password,
        regNumber: formData.regNumber,
        campus: formData.campus,
        gender: formData.gender,
      });

      if (result.success) {
        setMessage('Login successful! Redirecting...');
        setMessageType('success');
      } else {
        setMessage(result.message || 'Login failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An error occurred during login');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.regNumber || !formData.campus || !formData.gender) {
      setMessage('Please fill in all required fields');
      setMessageType('error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    if (formData.password.length < 8) {
      setMessage('Password must be at least 8 characters');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        regNumber: formData.regNumber,
        campus: formData.campus,
        gender: formData.gender,
        allowAdminUpdates: formData.allowAdminUpdates,
      });

      if (result.success) {
        setMessage(result.message || 'Registration successful! Please log in.');
        setMessageType('success');
        setTimeout(() => setMode('login'), 2000);
      } else {
        setMessage(result.message || 'Registration failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An error occurred during registration');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetRequestSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!onPasswordResetRequest) {
      setMessage('Password reset is not available right now.');
      setMessageType('error');
      return;
    }

    if (
      !resetRequestData.email ||
      !resetRequestData.regNumber ||
      !resetRequestData.campus ||
      !resetRequestData.gender
    ) {
      setMessage('Email, registration number, campus, and gender are required.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onPasswordResetRequest(resetRequestData);
      if (result.success) {
        setMessage(
          result.message ||
            'Reset request sent. After admin approval, use the code to set a new password.'
        );
        setMessageType('success');
        setResetCodeData({
          email: resetRequestData.email,
          regNumber: resetRequestData.regNumber,
          campus: resetRequestData.campus,
          gender: resetRequestData.gender,
          resetCode: '',
          newPassword: '',
          confirm: '',
        });
        setMode('reset');
      } else {
        setMessage(result.message || 'Reset request failed.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An error occurred while sending the reset request.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetConfirmSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!onPasswordResetConfirm) {
      setMessage('Password reset confirmation is not available right now.');
      setMessageType('error');
      return;
    }

    if (
      !resetCodeData.email ||
      !resetCodeData.regNumber ||
      !resetCodeData.campus ||
      !resetCodeData.gender ||
      !resetCodeData.resetCode ||
      !resetCodeData.newPassword ||
      !resetCodeData.confirm
    ) {
      setMessage('All reset fields are required.');
      setMessageType('error');
      return;
    }

    if (resetCodeData.newPassword !== resetCodeData.confirm) {
      setMessage('New passwords do not match.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onPasswordResetConfirm(resetCodeData);
      if (result.success) {
        setMessage(result.message || 'Password updated successfully.');
        setMessageType('success');
        setMode('login');
        setResetRequestData({
          email: '',
          regNumber: '',
          campus: '',
          gender: '',
          reason: '',
        });
        setResetCodeData({
          email: '',
          regNumber: '',
          campus: '',
          gender: '',
          resetCode: '',
          newPassword: '',
          confirm: '',
        });
        setFormData({
          email: '',
          password: '',
          regNumber: '',
          campus: '',
          gender: '',
          name: '',
          confirmPassword: '',
          allowAdminUpdates: false,
        });
      } else {
        setMessage(result.message || 'Password update failed.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An error occurred while updating the password.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const studyCampuses = STUDY_CAMPUSES[formData.campus] || [];

  return (
    <div className={`student-login-container ${theme}`}>
      <div className={`login-card ${mode === 'reset' ? 'reset-layout' : ''}`}>
        <div className="login-header">
          <button className="back-button" onClick={onBack} title="Back to portal selection">
            <FaArrowLeft />
          </button>
          <h2>
            {mode === 'login' ? 'Student Login' : mode === 'register' ? 'Student Registration' : 'Reset Password'}
          </h2>
        </div>

        {message && (
          <div className={`message-banner ${messageType}`}>
            {message}
          </div>
        )}

        <div className="login-form">
          {mode === 'login' ? (
            // LOGIN FORM
            <>
              <div className="form-group">
                <label htmlFor="login-email">
                  <FaEnvelope className="icon" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="student@university.edu"
                  disabled={isSyncing || isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-regnumber">
                  <FaIdCard className="icon" />
                  Registration Number
                </label>
                <input
                  type="text"
                  id="login-regnumber"
                  name="regNumber"
                  value={formData.regNumber}
                  onChange={handleInputChange}
                  placeholder="E.g., UR/2024/001"
                  disabled={isSyncing || isLoading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="login-campus">
                    <FaMapMarkerAlt className="icon" />
                    Campus
                  </label>
                  <select
                    id="login-campus"
                    name="campus"
                    value={formData.campus}
                    onChange={handleInputChange}
                    disabled={isSyncing || isLoading}
                  >
                    <option value="">Select Campus</option>
                    <option value="UR">University of Rwanda</option>
                    <option value="RP">Rwanda Polytechnic</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="login-gender">
                    <FaVenusMars className="icon" />
                    Gender
                  </label>
                  <select
                    id="login-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={isSyncing || isLoading}
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password">
                  <FaLock className="icon" />
                  Password
                </label>
                <div className="password-input">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    id="login-password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    disabled={isSyncing || isLoading}
                  />
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    disabled={isSyncing || isLoading}
                  >
                    {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                className="login-button"
                onClick={handleLogin}
                disabled={isSyncing || isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              <div className="form-footer">
                <p>Don't have an account? <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setMode('register');
                    setMessage('');
                    setFormData({
                      email: '',
                      password: '',
                      regNumber: '',
                      campus: '',
                      gender: '',
                      name: '',
                      confirmPassword: '',
                      allowAdminUpdates: false,
                    });
                  }}
                >
                  Register here
                </button></p>
                <p>
                  Forgot your password?{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setMode('reset');
                      setMessage('');
                    }}
                  >
                    Reset it here
                  </button>
                </p>
              </div>
            </>
          ) : mode === 'register' ? (
            // REGISTRATION FORM
            <>
              <div className="form-group">
                <label htmlFor="reg-name">
                  <FaUser className="icon" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="reg-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  disabled={isSyncing || isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">
                  <FaEnvelope className="icon" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="reg-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="student@university.edu"
                  disabled={isSyncing || isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-regnumber">
                  <FaIdCard className="icon" />
                  Registration Number
                </label>
                <input
                  type="text"
                  id="reg-regnumber"
                  name="regNumber"
                  value={formData.regNumber}
                  onChange={handleInputChange}
                  placeholder="E.g., UR/2024/001"
                  disabled={isSyncing || isLoading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reg-campus">
                    <FaMapMarkerAlt className="icon" />
                    Campus
                  </label>
                  <select
                    id="reg-campus"
                    name="campus"
                    value={formData.campus}
                    onChange={handleInputChange}
                    disabled={isSyncing || isLoading}
                  >
                    <option value="">Select Campus</option>
                    <option value="UR">University of Rwanda</option>
                    <option value="RP">Rwanda Polytechnic</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-gender">
                    <FaVenusMars className="icon" />
                    Gender
                  </label>
                  <select
                    id="reg-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={isSyncing || isLoading}
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">
                  <FaLock className="icon" />
                  Password
                </label>
                <div className="password-input">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    id="reg-password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min 8 characters"
                    disabled={isSyncing || isLoading}
                  />
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    disabled={isSyncing || isLoading}
                  >
                    {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm-password">
                  <FaLock className="icon" />
                  Confirm Password
                </label>
                <div className="password-input">
                  <input
                    type={isConfirmPasswordVisible ? 'text' : 'password'}
                    id="reg-confirm-password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    disabled={isSyncing || isLoading}
                  />
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    disabled={isSyncing || isLoading}
                  >
                    {isConfirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="allow-admin-updates"
                  name="allowAdminUpdates"
                  checked={formData.allowAdminUpdates}
                  onChange={handleInputChange}
                  disabled={isSyncing || isLoading}
                />
                <label htmlFor="allow-admin-updates">
                  Allow admin to manage my account information
                </label>
              </div>

              <button
                className="register-button"
                onClick={handleRegister}
                disabled={isSyncing || isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="form-footer">
                <p>Already have an account? <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setMode('login');
                    setMessage('');
                  }}
                >
                  Login here
                </button></p>
                <p>
                  Forgot your password?{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setMode('reset');
                      setMessage('');
                    }}
                  >
                    Reset it here
                  </button>
                </p>
              </div>
            </>
          ) : (
            <div className="reset-mode">
              <form className="reset-card" onSubmit={handlePasswordResetRequestSubmit}>
                <h3>Request password reset</h3>
                <p>Use the same email and registration number you registered with. The admin will review and issue a reset code.</p>

                <div className="form-group">
                  <label htmlFor="reset-email">
                    <FaEnvelope className="icon" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="reset-email"
                    value={resetRequestData.email}
                    onChange={(event) =>
                      setResetRequestData({ ...resetRequestData, email: event.target.value })
                    }
                    placeholder="student@university.edu"
                    disabled={isSyncing || isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reset-regnumber">
                    <FaIdCard className="icon" />
                    Registration Number
                  </label>
                  <input
                    type="text"
                    id="reset-regnumber"
                    value={resetRequestData.regNumber}
                    onChange={(event) =>
                      setResetRequestData({ ...resetRequestData, regNumber: event.target.value })
                    }
                    placeholder="Enter your reg number"
                    disabled={isSyncing || isLoading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reset-campus">
                      <FaMapMarkerAlt className="icon" />
                      Campus
                    </label>
                    <select
                      id="reset-campus"
                      value={resetRequestData.campus}
                      onChange={(event) =>
                        setResetRequestData({ ...resetRequestData, campus: event.target.value })
                      }
                      disabled={isSyncing || isLoading}
                    >
                      <option value="">Select Campus</option>
                      <option value="UR">University of Rwanda</option>
                      <option value="RP">Rwanda Polytechnic</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reset-gender">
                      <FaVenusMars className="icon" />
                      Gender
                    </label>
                    <select
                      id="reset-gender"
                      value={resetRequestData.gender}
                      onChange={(event) =>
                        setResetRequestData({ ...resetRequestData, gender: event.target.value })
                      }
                      disabled={isSyncing || isLoading}
                    >
                      <option value="">Select Gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reset-reason">Reason</label>
                  <textarea
                    id="reset-reason"
                    value={resetRequestData.reason}
                    onChange={(event) =>
                      setResetRequestData({ ...resetRequestData, reason: event.target.value })
                    }
                    placeholder="Optional note for the admin"
                    disabled={isSyncing || isLoading}
                  />
                </div>

                <button className="login-button" type="submit" disabled={isSyncing || isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Request'}
                </button>

                <div className="reset-switch-row">
                  <button
                    type="button"
                    className="reset-switch"
                    onClick={() => {
                      setMode('login');
                      setMessage('');
                    }}
                  >
                    Back to login
                  </button>
                </div>
              </form>

              <form className="reset-card" onSubmit={handlePasswordResetConfirmSubmit}>
                <h3>Set new password</h3>
                <p>After the admin approves your request and gives you a code, enter it here to finish the reset.</p>

                <div className="form-group">
                  <label htmlFor="reset-confirm-email">
                    <FaEnvelope className="icon" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="reset-confirm-email"
                    value={resetCodeData.email}
                    onChange={(event) =>
                      setResetCodeData({ ...resetCodeData, email: event.target.value })
                    }
                    placeholder="student@university.edu"
                    disabled={isSyncing || isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reset-confirm-regnumber">
                    <FaIdCard className="icon" />
                    Registration Number
                  </label>
                  <input
                    type="text"
                    id="reset-confirm-regnumber"
                    value={resetCodeData.regNumber}
                    onChange={(event) =>
                      setResetCodeData({ ...resetCodeData, regNumber: event.target.value })
                    }
                    placeholder="Enter your reg number"
                    disabled={isSyncing || isLoading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reset-confirm-campus">
                      <FaMapMarkerAlt className="icon" />
                      Campus
                    </label>
                    <select
                      id="reset-confirm-campus"
                      value={resetCodeData.campus}
                      onChange={(event) =>
                        setResetCodeData({ ...resetCodeData, campus: event.target.value })
                      }
                      disabled={isSyncing || isLoading}
                    >
                      <option value="">Select Campus</option>
                      <option value="UR">University of Rwanda</option>
                      <option value="RP">Rwanda Polytechnic</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reset-confirm-gender">
                      <FaVenusMars className="icon" />
                      Gender
                    </label>
                    <select
                      id="reset-confirm-gender"
                      value={resetCodeData.gender}
                      onChange={(event) =>
                        setResetCodeData({ ...resetCodeData, gender: event.target.value })
                      }
                      disabled={isSyncing || isLoading}
                    >
                      <option value="">Select Gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reset-code">
                    <FaLock className="icon" />
                    Reset Code
                  </label>
                  <input
                    type="text"
                    id="reset-code"
                    value={resetCodeData.resetCode}
                    onChange={(event) =>
                      setResetCodeData({ ...resetCodeData, resetCode: event.target.value })
                    }
                    placeholder="Enter code from admin"
                    disabled={isSyncing || isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reset-new-password">
                    <FaLock className="icon" />
                    New Password
                  </label>
                  <div className="password-input">
                    <input
                      type={isPasswordVisible ? 'text' : 'password'}
                      id="reset-new-password"
                      value={resetCodeData.newPassword}
                      onChange={(event) =>
                        setResetCodeData({ ...resetCodeData, newPassword: event.target.value })
                      }
                      placeholder="Create a new password"
                      disabled={isSyncing || isLoading}
                    />
                    <button
                      type="button"
                      className="visibility-toggle"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      disabled={isSyncing || isLoading}
                    >
                      {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reset-confirm-password">
                    <FaLock className="icon" />
                    Confirm Password
                  </label>
                  <div className="password-input">
                    <input
                      type={isConfirmPasswordVisible ? 'text' : 'password'}
                      id="reset-confirm-password"
                      value={resetCodeData.confirm}
                      onChange={(event) =>
                        setResetCodeData({ ...resetCodeData, confirm: event.target.value })
                      }
                      placeholder="Confirm new password"
                      disabled={isSyncing || isLoading}
                    />
                    <button
                      type="button"
                      className="visibility-toggle"
                      onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                      disabled={isSyncing || isLoading}
                    >
                      {isConfirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button className="login-button" type="submit" disabled={isSyncing || isLoading}>
                  {isLoading ? 'Updating...' : 'Set New Password'}
                </button>

                <div className="reset-switch-row">
                  <button
                    type="button"
                    className="reset-switch"
                    onClick={() => {
                      setMode('login');
                      setMessage('');
                    }}
                  >
                    Back to login
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
