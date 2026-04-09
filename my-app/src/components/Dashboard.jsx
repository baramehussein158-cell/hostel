import React, { useState, useEffect, useRef } from 'react';
import { FaSun, FaMoon, FaCheckCircle, FaClock, FaBed, FaCalendarAlt, FaClipboardList } from 'react-icons/fa';
import emailjs from '@emailjs/browser';
import { useTheme } from '../contexts/ThemeContext';
import './Dashboard.scss';

const Dashboard = ({
  onLogout,
  student,
  campus,
  totalRooms,
  appliedCount,
  remainingRooms,
  roomClosed,
  pastDeadline,
  deadline,
  applicationSubmitted,
  applicationData,
  onRoomApplication,
}) => {
  const consumedRooms = appliedCount;
  const campusName = campus === 'RP' ? 'Rwanda Polytechnic' : 'University of Rwanda';
  const campusTagline = campus === 'RP'
    ? 'RP dashboard with yellow, green, blue, and white brand accents.'
    : 'UR dashboard with clean blue and white campus styling.';
  const occupancyRate = Math.round((consumedRooms / totalRooms) * 100);
  const { theme, toggleTheme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('status');
  const [notification, setNotification] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const formRef = useRef(null);
  const statusRef = useRef(null);
  const canApply = !roomClosed && !applicationSubmitted;

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification('');
    }, 4200);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleApplicationSubmit = (data) => {
    onRoomApplication(data);
    setShowForm(false);
    setViewMode('status');
    setNotification('Your hostel room application was submitted successfully. We will review it soon.');
  };

  const handleProfileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`dashboard ${theme} campus-${campus.toLowerCase()}`}>
      <header className="dashboard-header">
        <div className="header-main">
          <div>
            <p className="eyebrow">CampusStay Student Portal</p>
            <h1>Welcome back, {student.name}</h1>
            <p className="subheading">Manage your room application, track progress, and update details from one polished portal.</p>
            <div className="campus-intro">
              <span className="campus-label">{campusName}</span>
              <div className="campus-chip-group">
                <button type="button" className="campus-chip"><FaBed /> Room Application</button>
                <button type="button" className="campus-chip"><FaClipboardList /> Application Status</button>
                <button type="button" className="campus-chip"><FaCalendarAlt /> Deadlines</button>
              </div>
            </div>
          </div>
          <div className="profile-block">
            <div className="avatar">
              {profileImage ? (
                <img src={profileImage} alt="Profile" />
              ) : (
                student.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="profile-info">
              <strong>{student.name}</strong>
              <span>{student.email || 'student@university.edu'}</span>
              <label htmlFor="profile-upload" className="profile-upload-btn">
                Change Photo
              </label>
              <input
                type="file"
                id="profile-upload"
                accept="image/*"
                onChange={handleProfileUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        {notification && (
          <div className="toast-notification">
            <FaCheckCircle className="toast-icon" />
            <span>{notification}</span>
          </div>
        )}

        <section className="top-grid">
          <article className="hero-panel">
            <div className="hero-pill">Application Overview</div>
            <h2>Fast, guided hostel application for modern student life.</h2>
            <p>Complete your details, submit preferences, and get updates in real time. The next available room can be reserved with one smooth workflow.</p>
            <div className="hero-actions">
              <button
                className="primary-action"
                onClick={() => {
                  setShowForm(true);
                  setViewMode('form');
                }}
                disabled={!canApply}
              >
                {applicationSubmitted ? 'Application Submitted' : 'Apply for Room'}
              </button>
              <button
                className="secondary-action"
                onClick={() => {
                  setShowForm(false);
                  setViewMode('status');
                  if (statusRef.current) {
                    statusRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                See Status
              </button>
            </div>
            <div className="hero-footline">
              <span className="room-badge">{remainingRooms} rooms remaining</span>
              <p className="hero-note">Current view: {viewMode === 'form' ? 'Application form' : 'Status summary'}</p>
            </div>
            {roomClosed && (
              <div className="hero-alert">
                {pastDeadline ? (
                  <p>Applications are closed because the university deadline of {deadline.toLocaleDateString()} has passed.</p>
                ) : (
                  <p>Applications are closed because all rooms have been allocated.</p>
                )}
              </div>
            )}
          </article>
          <div className="metric-cards">
            <div className="metric-card">
              <FaClipboardList className="metric-icon" />
              <span>Steps to finish</span>
              <strong>4</strong>
            </div>
            <div className="metric-card">
              <FaBed className="metric-icon" />
              <span>Rooms remaining</span>
              <strong>{remainingRooms}</strong>
            </div>
            <div className="metric-card">
              <FaCalendarAlt className="metric-icon" />
              <span>Review window</span>
              <strong>3–5 days</strong>
            </div>
          </div>
        </section>

        <section className="main-grid">
          <div ref={statusRef} className="overview-card">
            <div className="card-header">
              <div>
                <p className="eyebrow">Application status</p>
                <h3>{applicationSubmitted ? 'Submitted' : 'Ready to start'}</h3>
              </div>
              <span className={`status-badge ${applicationSubmitted ? 'approved' : 'pending'}`}>
                {applicationSubmitted ? 'Submitted' : 'Pending'}
              </span>
            </div>

            <div className="status-summary">
              <div>
                <strong>{applicationSubmitted ? '3-5 days' : 'Next step'}</strong>
                <p>{applicationSubmitted ? 'Review in progress' : 'Complete your room application'}</p>
              </div>
              <div>
                <strong>{applicationSubmitted ? remainingRooms : '4'}</strong>
                <p>{applicationSubmitted ? 'Rooms available' : 'Workflow steps'}</p>
              </div>
            </div>

            {applicationSubmitted && applicationData ? (
              <>
                <div className="summary-block">
                  <div>
                    <span>Name</span>
                    <strong>{applicationData.name}</strong>
                  </div>
                  <div>
                    <span>Study campus</span>
                    <strong>{applicationData.campus}</strong>
                  </div>
                  <div>
                    <span>Room choice</span>
                    <strong>{applicationData.roomType}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{applicationData.phone}</strong>
                  </div>
                </div>
                <div className="room-usage-block">
                  <div className="room-card room-card-consumed">
                    <span>Applied rooms</span>
                    <strong>{consumedRooms}</strong>
                  </div>
                  <div className="room-card room-card-free">
                    <span>Remaining free rooms</span>
                    <strong>{remainingRooms}</strong>
                  </div>
                  <div className="room-occupancy">
                    <span>Occupancy status</span>
                    <div className="occupancy-bar">
                      <div className="occupancy-fill" style={{ width: `${occupancyRate}%` }} />
                    </div>
                    <strong>{occupancyRate}% full</strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="summary-block empty">
                <p>Submit the application form to see your room request and timeline here.</p>
              </div>
            )}
          </div>

          <aside className="info-card">
            <div className="info-header">
              <h3>Helpful timeline</h3>
            </div>
            <ul>
              <li><FaClock /> Fill out the application in one go.</li>
              <li><FaCheckCircle /> Receive confirmation by email.</li>
              <li><FaBed /> Room allocated within days.</li>
            </ul>
          </aside>
        </section>

        {showForm && (
          <div ref={formRef} className="form-anchor">
            <ApplicationForm onBack={() => setShowForm(false)} onSubmit={handleApplicationSubmit} />
          </div>
        )}
      </div>
    </div>
  );
};

const ApplicationForm = ({ onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomType: 'single',
    accessibility: '',
    comments: ''
  });
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'email') {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    // Submit the application
    onSubmit(formData);

    // Send confirmation email
    try {
      // Replace these with your actual EmailJS credentials from https://www.emailjs.com/
      const serviceId = 'your_service_id_here'; // e.g., 'service_123456'
      const templateId = 'your_template_id_here'; // e.g., 'template_abcdef'
      const publicKey = 'your_public_key_here'; // e.g., 'ABC123def456'

      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: formData.email,
          to_name: formData.name,
          room_type: formData.roomType,
          phone: formData.phone,
          application_date: new Date().toLocaleDateString(),
        },
        publicKey
      );
      alert('Application submitted successfully! A confirmation email has been sent to ' + formData.email + '. Check your inbox (and spam folder) on your phone or computer.');
    } catch (error) {
      console.error('Email send failed:', error);
      alert('Application submitted, but email confirmation failed. Please contact support or check your email later. Error: ' + error.text);
    }
  };

  return (
    <div className="application-form-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Detailed application</p>
          <h2>Hostel room request</h2>
        </div>
        <button onClick={onBack} className="back-btn">← Back</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            {emailError && <p className="error">{emailError}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="roomType">Preferred Room Type</label>
            <select id="roomType" name="roomType" value={formData.roomType} onChange={handleChange}>
              <option value="single">Single Room</option>
              <option value="shared">Shared Room</option>
              <option value="suite">Suite</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="accessibility">Accessibility Needs</label>
          <textarea id="accessibility" name="accessibility" value={formData.accessibility} onChange={handleChange} rows="3" placeholder="Describe requirements..."></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="comments">Additional Comments</label>
          <textarea id="comments" name="comments" value={formData.comments} onChange={handleChange} rows="3" placeholder="Any preferences or notes..."></textarea>
        </div>

        <button type="submit" className="submit-btn">Submit Application</button>
      </form>
    </div>
  );
};

export default Dashboard;