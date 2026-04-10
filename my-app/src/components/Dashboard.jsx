import React, { useEffect, useRef, useState } from 'react';
import {
  FaBed,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaMoon,
  FaSun,
} from 'react-icons/fa';
import emailjs from '@emailjs/browser';
import { useTheme } from '../contexts/ThemeContext';
import { APPLICATION_STATUS_LABELS, buildProfileImageSrc } from '../data/portalData';
import { createProfilePreviewUrl, prepareProfileImageForUpload } from '../utils/profileImage';
import './Dashboard.scss';

const getSavedProfileImage = (student) =>
  buildProfileImageSrc(student.profileImageUrl, student.profileImageUpdatedAt) || null;

const STUDENT_STATUS_COPY = {
  pending: {
    title: 'Submitted',
    summary: 'Your room request is waiting for admin review.',
    eta: '3-5 days',
  },
  approved: {
    title: 'Approved',
    summary: 'Your room has been approved and is ready for allocation details.',
    eta: 'Allocated',
  },
  waitlisted: {
    title: 'Waitlisted',
    summary: 'You are on the waiting list while room capacity is reviewed.',
    eta: 'Queue active',
  },
  rejected: {
    title: 'Needs update',
    summary: 'Your last application was rejected. You can submit a fresh request.',
    eta: 'Re-apply now',
  },
};

const Dashboard = ({
  onLogout,
  student,
  campus,
  totalRooms,
  occupiedRooms,
  remainingRooms,
  roomClosed,
  pastDeadline,
  deadline,
  latestApplication,
  studentApplications,
  onRoomApplication,
  onProfileImageUpload,
}) => {
  const campusName = campus === 'RP' ? 'Rwanda Polytechnic' : 'University of Rwanda';
  const { theme, toggleTheme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('status');
  const [notification, setNotification] = useState('');
  const [profileImage, setProfileImage] = useState(getSavedProfileImage(student) || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const formRef = useRef(null);
  const statusRef = useRef(null);
  const previewUrlRef = useRef(null);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const applicationStatus = latestApplication?.status ?? 'ready';
  const hasApplication = Boolean(latestApplication);
  const canApply = !roomClosed && (!latestApplication || latestApplication.status === 'rejected');
  const statusCopy = STUDENT_STATUS_COPY[applicationStatus] ?? {
    title: 'Ready to start',
    summary: 'Complete your room application to begin the review process.',
    eta: 'Next step',
  };

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm]);

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timer = setTimeout(() => setNotification(''), 4200);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    const savedProfileImage = getSavedProfileImage(student);
    setProfileImage(savedProfileImage);

    if (savedProfileImage && previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, [student.id, student.profileImageUrl, student.profileImageUpdatedAt]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    []
  );

  const handleApplicationSubmit = async (formData) => {
    const result = await onRoomApplication(formData);
    if (!result.success) {
      setNotification(result.message);
      return result;
    }

    setShowForm(false);
    setViewMode('status');
    setNotification('Your hostel room application was submitted successfully. Admin review is now pending.');
    return result;
  };

  const handleProfileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setNotification('Please choose a valid image file.');
      event.target.value = '';
      return;
    }

    setNotification('');
    setIsUploadingPhoto(true);

    try {
      const optimizedImageFile = await prepareProfileImageForUpload(file);
      const previewImage = createProfilePreviewUrl(optimizedImageFile);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      previewUrlRef.current = previewImage;
      setProfileImage(previewImage);
      const result = await onProfileImageUpload(optimizedImageFile);

      if (!result.success) {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }

        setProfileImage(getSavedProfileImage(student));
        setNotification(result.message);
        return;
      }

      setProfileImage(result.url || getSavedProfileImage(student));
      setNotification('Profile photo updated successfully.');
    } catch (error) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      setProfileImage(getSavedProfileImage(student));
      console.error('Profile upload failed:', error);
      setNotification(error.message || 'Failed to upload the selected image.');
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = '';
    }
  };

  return (
    <div className={`dashboard ${theme} campus-${campus.toLowerCase()}`}>
      <header className="dashboard-header">
        <div className="header-main">
          <div>
            <p className="eyebrow">CampusStay Student Portal</p>
            <h1>Welcome back, {student.name}</h1>
            <p className="subheading">
              Manage your room application, track review decisions, and keep your student profile ready from one
              portal.
            </p>
            <div className="campus-intro">
              <span className="campus-label">{campusName}</span>
              <div className="campus-chip-group">
                <button type="button" className="campus-chip">
                  <FaBed /> Room Application
                </button>
                <button type="button" className="campus-chip">
                  <FaClipboardList /> Status Tracking
                </button>
                <button type="button" className="campus-chip">
                  <FaCalendarAlt /> Deadline Monitor
                </button>
              </div>
            </div>
          </div>

          <div className="profile-block">
            <div className="avatar">{profileImage ? <img src={profileImage} alt="Profile" /> : student.name?.charAt(0).toUpperCase()}</div>
            <div className="profile-info">
              <strong>{student.name}</strong>
              <span>{student.email}</span>
              <span>{student.regNumber}</span>
              <label htmlFor="profile-upload" className="profile-upload-btn">
                {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </label>
              <input
                type="file"
                id="profile-upload"
                accept="image/*"
                onChange={handleProfileUpload}
                disabled={isUploadingPhoto}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
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
            <h2>Stay on top of your housing request without leaving the portal.</h2>
            <p>
              Track your latest application status, watch room availability for your campus, and reapply quickly
              if admin asks for changes.
            </p>

            <div className="hero-actions">
              <button
                className="primary-action"
                onClick={() => {
                  setShowForm(true);
                  setViewMode('form');
                }}
                disabled={!canApply}
              >
                {latestApplication?.status === 'rejected'
                  ? 'Submit New Application'
                  : hasApplication
                    ? 'Application Active'
                    : 'Apply for Room'}
              </button>
              <button
                className="secondary-action"
                onClick={() => {
                  setShowForm(false);
                  setViewMode('status');
                  statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                  <p>Applications are closed because the deadline of {deadline.toLocaleDateString()} has passed.</p>
                ) : (
                  <p>Applications are closed because no more approved room capacity remains for your campus.</p>
                )}
              </div>
            )}

            {latestApplication?.status === 'rejected' && (
              <div className="hero-alert warning">
                <p>Your last application was rejected. You can submit a corrected request now.</p>
              </div>
            )}
          </article>

          <div className="metric-cards">
            <div className="metric-card">
              <FaClipboardList className="metric-icon" />
              <span>Applications sent</span>
              <strong>{studentApplications.length}</strong>
            </div>
            <div className="metric-card">
              <FaBed className="metric-icon" />
              <span>Rooms remaining</span>
              <strong>{remainingRooms}</strong>
            </div>
            <div className="metric-card">
              <FaCalendarAlt className="metric-icon" />
              <span>Latest status</span>
              <strong>{hasApplication ? APPLICATION_STATUS_LABELS[latestApplication.status] : 'Ready'}</strong>
            </div>
          </div>
        </section>

        <section className="main-grid">
          <div ref={statusRef} className="overview-card">
            <div className="card-header">
              <div>
                <p className="eyebrow">Application status</p>
                <h3>{statusCopy.title}</h3>
              </div>
              <span className={`status-badge ${applicationStatus}`}>
                {hasApplication ? APPLICATION_STATUS_LABELS[latestApplication.status] : 'Pending'}
              </span>
            </div>

            <div className="status-summary">
              <div>
                <strong>{statusCopy.eta}</strong>
                <p>{statusCopy.summary}</p>
              </div>
              <div>
                <strong>{remainingRooms}</strong>
                <p>Rooms still available on your campus</p>
              </div>
            </div>

            {hasApplication ? (
              <>
                <div className="summary-block">
                  <div>
                    <span>Name</span>
                    <strong>{latestApplication.name}</strong>
                  </div>
                  <div>
                    <span>Study campus</span>
                    <strong>{latestApplication.campus}</strong>
                  </div>
                  <div>
                    <span>Room choice</span>
                    <strong>{latestApplication.roomType}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{latestApplication.phone}</strong>
                  </div>
                  <div>
                    <span>Submitted on</span>
                    <strong>{new Date(latestApplication.submittedAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span>Assigned room</span>
                    <strong>{latestApplication.assignedRoom || 'Waiting for admin assignment'}</strong>
                  </div>
                </div>

                <div className="room-usage-block">
                  <div className="room-card room-card-consumed">
                    <span>Approved rooms on campus</span>
                    <strong>{occupiedRooms}</strong>
                  </div>
                  <div className="room-card room-card-free">
                    <span>Remaining free rooms</span>
                    <strong>{remainingRooms}</strong>
                  </div>
                  <div className="room-occupancy">
                    <span>Campus occupancy</span>
                    <div className="occupancy-bar">
                      <div className="occupancy-fill" style={{ width: `${occupancyRate}%` }} />
                    </div>
                    <strong>{occupancyRate}% full</strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="summary-block empty">
                <p>Submit your first hostel application to see admin review updates here.</p>
              </div>
            )}
          </div>

          <aside className="info-card">
            <div className="info-header">
              <h3>Helpful timeline</h3>
            </div>
            <ul>
              <li>
                <FaClock /> Fill out the application in one sitting.
              </li>
              <li>
                <FaCheckCircle /> Wait for admin review and room decision.
              </li>
              <li>
                <FaBed /> Check your assigned room once approved.
              </li>
            </ul>
          </aside>
        </section>

        {showForm && (
          <div ref={formRef} className="form-anchor">
            <ApplicationForm student={student} onBack={() => setShowForm(false)} onSubmit={handleApplicationSubmit} />
          </div>
        )}
      </div>
    </div>
  );
};

const ApplicationForm = ({ student, onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email,
    phone: '',
    campus: student.campus,
    roomType: 'single',
    accessibility: '',
    comments: '',
  });
  const [emailError, setEmailError] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    if (event.target.name === 'email') {
      setEmailError('');
    }
    setFormMessage('');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit(formData);
    setIsSubmitting(false);
    if (!result.success) {
      setFormMessage(result.message);
      return;
    }

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      return;
    }

    try {
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
    } catch (error) {
      console.error('Email send failed:', error);
      setFormMessage('Application saved, but email confirmation could not be sent.');
    }
  };

  return (
    <div className="application-form-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Detailed application</p>
          <h2>Hostel room request</h2>
        </div>
        <button onClick={onBack} className="back-btn" type="button">
          Back
        </button>
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
          <label htmlFor="campus">Campus</label>
          <input type="text" id="campus" name="campus" value={formData.campus} readOnly />
        </div>

        <div className="form-group">
          <label htmlFor="accessibility">Accessibility Needs</label>
          <textarea
            id="accessibility"
            name="accessibility"
            value={formData.accessibility}
            onChange={handleChange}
            rows="3"
            placeholder="Describe requirements..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="comments">Additional Comments</label>
          <textarea
            id="comments"
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows="3"
            placeholder="Any preferences or notes..."
          />
        </div>

        {formMessage && <p className="error">{formMessage}</p>}

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default Dashboard;
