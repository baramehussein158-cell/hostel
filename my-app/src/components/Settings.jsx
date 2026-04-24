import React, { useEffect, useState } from 'react';
import {
  FaUser,
  FaMoon,
  FaSun,
  FaSave,
  FaUserEdit,
  FaPalette,
  FaCheck,
} from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import './Settings.scss';

const Settings = ({
  user,
  onUpdateProfile,
  userType = 'student'
}) => {
  const { theme, color, changeTheme, changeColor, colorOptions } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    allowAdminUpdates: user?.allowAdminUpdates || false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      gender: user?.gender || '',
      allowAdminUpdates: user?.allowAdminUpdates || false,
    });
  }, [
    user?.allowAdminUpdates,
    user?.email,
    user?.gender,
    user?.name,
    user?.phone,
  ]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      const result = await onUpdateProfile({
        ...formData,
      });
      if (result.success) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage(result.message || 'Failed to update profile');
      }
    } catch {
      setMessage('An error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleColorChange = (newColor) => {
    changeColor(newColor);
    setMessage('Theme color updated!');
    setTimeout(() => setMessage(''), 2000);
  };

  const COLOR_DEFINITIONS = {
    blue: { name: 'Blue', hex: '#3b82f6' },
    purple: { name: 'Purple', hex: '#8b5cf6' },
    green: { name: 'Green', hex: '#10b981' },
    red: { name: 'Red', hex: '#ef4444' },
    orange: { name: 'Orange', hex: '#f59e0b' },
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'appearance', label: 'Appearance', icon: FaPalette },
    { id: 'account', label: 'Account', icon: FaUserEdit },
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Manage your account preferences and appearance</p>
      </div>

      <div className="settings-content">
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-panel">
          {message && (
            <div className={`settings-message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="settings-section">
              <h3>Profile Information</h3>
              <div className="profile-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {userType === 'student' && (
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="allowAdminUpdates"
                        checked={formData.allowAdminUpdates}
                        onChange={handleInputChange}
                      />
                      <span>Allow admin to update my account details</span>
                    </label>
                  </div>
                )}

                <button
                  className="save-button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  <FaSave />
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3>Appearance Settings</h3>
              
              <div className="appearance-group">
                <h4>Theme Mode</h4>
                <div className="theme-options">
                  <button
                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => changeTheme('light')}
                  >
                    <FaSun className="theme-icon" />
                    <span>Light Mode</span>
                    {theme === 'light' && <FaCheck className="check-icon" />}
                  </button>

                  <button
                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => changeTheme('dark')}
                  >
                    <FaMoon className="theme-icon" />
                    <span>Dark Mode</span>
                    {theme === 'dark' && <FaCheck className="check-icon" />}
                  </button>
                </div>
              </div>

              <div className="appearance-group">
                <h4>Color Theme</h4>
                <p className="color-description">Select a color that suits your style</p>
                <div className="color-options">
                  {colorOptions.map((colorOption) => {
                    const colorDef = COLOR_DEFINITIONS[colorOption] || {};
                    return (
                      <button
                        key={colorOption}
                        className={`color-option ${color === colorOption ? 'active' : ''}`}
                        onClick={() => handleColorChange(colorOption)}
                        style={{ '--color-hex': colorDef.hex }}
                        title={colorDef.name}
                      >
                        <div className="color-dot"></div>
                        <span>{colorDef.name}</span>
                        {color === colorOption && <FaCheck className="check-icon" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <h3>Account Settings</h3>
              <div className="account-info">
                {userType !== 'admin' && (
                  <div className="info-item">
                    <label>Registration Number</label>
                    <span>{user?.regNumber || 'Not set'}</span>
                  </div>
                )}

                <div className="info-item">
                  <label>Campus</label>
                  <span>{user?.campus || 'Not set'}</span>
                </div>

                <div className="info-item">
                  <label>Account Type</label>
                  <span>{userType === 'admin' ? 'Administrator' : 'Student'}</span>
                </div>

                <div className="info-item">
                  <label>Member Since</label>
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
