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
  onBack,
  registeredUsersCount,
  isSyncing,
}) => {
  const { theme } = useTheme();
  const [isLoginMode, setIsLoginMode] = useState(true);
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
        setTimeout(() => setIsLoginMode(true), 2000);
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

  const studyCampuses = STUDY_CAMPUSES[formData.campus] || [];

  return (
    <div className={`student-login-container ${theme}`}>
      <div className="login-card">
        <div className="login-header">
          <button className="back-button" onClick={onBack} title="Back to portal selection">
            <FaArrowLeft />
          </button>
          <h2>{isLoginMode ? 'Student Login' : 'Student Registration'}</h2>
          <div className="header-stats">
            <span className="stat">{registeredUsersCount} Students</span>
          </div>
        </div>

        {message && (
          <div className={`message-banner ${messageType}`}>
            {message}
          </div>
        )}

        <div className="login-form">
          {isLoginMode ? (
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
                    setIsLoginMode(false);
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
              </div>
            </>
          ) : (
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
                    setIsLoginMode(true);
                    setMessage('');
                  }}
                >
                  Login here
                </button></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
