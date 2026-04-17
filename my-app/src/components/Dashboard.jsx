import React, { useEffect, useRef, useState } from 'react';
import {
  FaBed,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaCreditCard,
  FaMoon,
  FaSun,
} from 'react-icons/fa';
import emailjs from '@emailjs/browser';
import { useTheme } from '../contexts/ThemeContext';
import {
  APPLICATION_STATUS_LABELS,
  HOSTEL_RENT_BY_ROOM_TYPE,
  PASSWORD_RESET_REQUEST_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_STATUS_LABELS,
  GENDER_OPTIONS,
  ROOM_TYPE_LABELS,
  STUDY_CAMPUSES,
  buildProfileImageSrc,
  formatCurrency,
} from '../data/portalData';
import { createProfilePreviewUrl, prepareProfileImageForUpload } from '../utils/profileImage';
import DashboardSidebar from './DashboardSidebar';
import './Dashboard.scss';

const getSavedProfileImage = (student) =>
  buildProfileImageSrc(student.profileImageUrl, student.profileImageUpdatedAt) || null;

const getGenderLabel = (gender) => GENDER_OPTIONS.find((option) => option.value === gender)?.label || gender || 'Not set';

const STUDENT_STATUS_COPY = {
  pending: {
    title: 'Submitted',
    summary: 'Your room request is waiting for payment confirmation and admin review.',
    eta: '3-5 days',
  },
  approved: {
    title: 'Approved',
    summary: 'Your payment was confirmed and your room is approved for allocation.',
    eta: 'Allocated',
  },
  waitlisted: {
    title: 'Waitlisted',
    summary: 'Your payment can remain valid while you wait for available room capacity.',
    eta: 'Queue active',
  },
  rejected: {
    title: 'Needs update',
    summary: 'Your last application was rejected. Review the feedback and submit a fresh request.',
    eta: 'Re-apply now',
  },
};

const PAYMENT_STATUS_COPY = {
  pending: {
    title: 'Payment under review',
    summary: 'The admin has not yet confirmed your hostel rent payment.',
  },
  verified: {
    title: 'Payment verified',
    summary: 'Your hostel rent payment is confirmed and your application can move to approval.',
  },
  rejected: {
    title: 'Payment needs attention',
    summary: 'Your payment details were not accepted yet. Contact the hostel admin for support.',
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
  latestPasswordResetRequest,
  onRoomApplication,
  onProfileImageUpload,
}) => {
  const campusName = campus === 'RP' ? 'Rwanda Polytechnic' : 'University of Rwanda';
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState('status');
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
  const paymentStatus = latestApplication?.paymentStatus ?? 'pending';
  const hasApplication = Boolean(latestApplication);
  const canApply = !roomClosed && (!latestApplication || latestApplication.status === 'rejected');
  const statusCopy = STUDENT_STATUS_COPY[applicationStatus] ?? {
    title: 'Ready to start',
    summary: 'Complete your room application to begin the review process.',
    eta: 'Next step',
  };
  const paymentCopy = PAYMENT_STATUS_COPY[paymentStatus] ?? {
    title: 'Payment not started',
    summary: 'Payment information will appear here after you submit an application.',
  };
  const passwordResetStatus = latestPasswordResetRequest?.status ?? '';
  const profileGenderLabel = getGenderLabel(student.gender);
  const profileAccessLabel = student.allowAdminUpdates ? 'Allowed' : 'Not allowed';

  // Sidebar stats for students
  const studentSidebarStats = {
    totalApplications: studentApplications.length,
    paymentsPending: hasApplication && paymentStatus === 'pending' ? 1 : 0,
    roomsAvailable: remainingRooms,
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
    const savedProfileImage = buildProfileImageSrc(student.profileImageUrl, student.profileImageUpdatedAt) || null;
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
    setNotification('Your hostel application and payment details were submitted. Admin verification is now pending.');
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
              Manage your room application, submit payment details, and track admin decisions from one portal.
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
                <button type="button" className="campus-chip">
                  <FaCreditCard /> Payment Verification
                </button>
              </div>
            </div>
          </div>

          <div className="profile-block">
            <div className="avatar">
              {profileImage ? <img src={profileImage} alt="Profile" /> : student.name?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <strong>{student.name}</strong>
              <span>{student.email}</span>
              <span>{student.regNumber}</span>
              <span>Gender: {profileGenderLabel}</span>
              <span>Admin update access: {profileAccessLabel}</span>
              <label htmlFor="profile-upload" className="profile-upload-btn">
                {isUploadingPhoto ? 'Uploading...' : 'Upload Profile Image'}
              </label>
              <small className="profile-upload-hint">PNG, JPG, or WEBP works best for your profile picture.</small>
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

      <div className="dashboard-layout-with-sidebar">
        <DashboardSidebar 
          activeView={activeView} 
          onViewChange={setActiveView} 
          stats={studentSidebarStats}
          userType="student"
        />

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
              Track your latest application status, submit hostel rent payment details, and reapply quickly if
              admin asks for changes.
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
            <div className="metric-card">
              <FaCreditCard className="metric-icon" />
              <span>Payment</span>
              <strong>{hasApplication ? PAYMENT_STATUS_LABELS[paymentStatus] : 'Not started'}</strong>
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
                <strong>{hasApplication ? PAYMENT_STATUS_LABELS[paymentStatus] : 'Not submitted'}</strong>
                <p>{hasApplication ? paymentCopy.summary : 'Payment verification starts after you apply.'}</p>
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
                    <span>Gender</span>
                    <strong>{getGenderLabel(latestApplication.gender)}</strong>
                  </div>
                  <div>
                    <span>Study campus</span>
                    <strong>{latestApplication.studyCampus || latestApplication.campus}</strong>
                  </div>
                  <div>
                    <span>Room choice</span>
                    <strong>{ROOM_TYPE_LABELS[latestApplication.roomType] || latestApplication.roomType}</strong>
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
                  <div>
                    <span>Payment method</span>
                    <strong>
                      {PAYMENT_METHODS.find((method) => method.value === latestApplication.paymentMethod)?.label ||
                        latestApplication.paymentMethod ||
                        'Not captured'}
                    </strong>
                  </div>
                  <div>
                    <span>Payment reference</span>
                    <strong>{latestApplication.paymentReference || 'Not captured'}</strong>
                  </div>
                  <div>
                    <span>Hostel rent paid</span>
                    <strong>{formatCurrency(latestApplication.amountPaid)}</strong>
                  </div>
                  <div>
                    <span>Payment review</span>
                    <strong>{PAYMENT_STATUS_LABELS[paymentStatus]}</strong>
                  </div>
                  <div>
                    <span>Admin update access</span>
                    <strong>{latestApplication.allowAdminUpdates ? 'Allowed' : 'Not allowed'}</strong>
                  </div>
                </div>

                {latestPasswordResetRequest && (
                  <div className="password-reset-status-card">
                    <div>
                      <p className="eyebrow">Password reset</p>
                      <h4>{PASSWORD_RESET_REQUEST_STATUS_LABELS[passwordResetStatus] || 'Pending'}</h4>
                      <p>
                        {passwordResetStatus === 'approved'
                          ? 'The admin issued a one-time code. Use it from the login reset section to set a new password.'
                          : passwordResetStatus === 'used'
                            ? 'Your password was updated successfully using the one-time code.'
                            : passwordResetStatus === 'rejected'
                              ? 'The admin rejected the request. Send a new request if you still need help.'
                              : 'Your password reset request has been sent to the admin.'}
                      </p>
                    </div>
                    <strong className={`password-reset-pill ${passwordResetStatus}`}>
                      {PASSWORD_RESET_REQUEST_STATUS_LABELS[passwordResetStatus] || 'Pending'}
                    </strong>
                  </div>
                )}

                <div className="payment-progress-card">
                  <div className="payment-progress-copy">
                    <p className="eyebrow">Payment verification</p>
                    <h4>{paymentCopy.title}</h4>
                    <p>{paymentCopy.summary}</p>
                  </div>
                  <div className="payment-progress-meta">
                    <span className={`payment-status-badge ${paymentStatus}`}>
                      {PAYMENT_STATUS_LABELS[paymentStatus]}
                    </span>
                    {latestApplication.paymentVerifiedAt && (
                      <small>Reviewed on {new Date(latestApplication.paymentVerifiedAt).toLocaleDateString()}</small>
                    )}
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
                <p>Submit your first hostel application to see admin review and payment updates here.</p>
              </div>
            )}
          </div>

          <aside className="info-card">
            <div className="info-header">
              <h3>Helpful timeline</h3>
            </div>
            <ul>
              <li>
                <FaClock /> Submit the hostel form with your payment details in one sitting.
              </li>
              <li>
                <FaCreditCard /> Wait for the admin to verify your hostel rent payment.
              </li>
              <li>
                <FaCheckCircle /> After payment verification, the admin can approve and assign your room.
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
    </div>
  );
};

const ApplicationForm = ({ student, onBack, onSubmit }) => {
  const campusOptions = STUDY_CAMPUSES[student.campus] ?? [];
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email,
    phone: '',
    campus: student.campus,
    gender: student.gender ?? '',
    allowAdminUpdates: Boolean(student.allowAdminUpdates),
    studyCampus: '',
    roomType: 'single',
    paymentMethod: PAYMENT_METHODS[0]?.value ?? 'mobile_money',
    paymentReference: '',
    amountPaid: String(HOSTEL_RENT_BY_ROOM_TYPE.single ?? ''),
    accessibility: '',
    comments: '',
  });
  const [emailError, setEmailError] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const expectedRentAmount = HOSTEL_RENT_BY_ROOM_TYPE[formData.roomType] ?? 0;

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: type === 'checkbox' ? checked : value,
      amountPaid:
        name === 'roomType'
          ? String(HOSTEL_RENT_BY_ROOM_TYPE[value] ?? currentFormData.amountPaid)
          : currentFormData.amountPaid,
    }));

    if (name === 'email') {
      setEmailError('');
    }

    setFormMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (!formData.studyCampus) {
      setFormMessage('Please choose your study campus.');
      return;
    }

    if (!formData.gender) {
      setFormMessage('Please select your gender for this hostel application.');
      return;
    }

    if (!formData.paymentMethod || !formData.paymentReference.trim()) {
      setFormMessage('Payment method and transaction reference are required.');
      return;
    }

    if (Number(formData.amountPaid) < expectedRentAmount) {
      setFormMessage('The full hostel rent must be paid before submitting this application.');
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
          study_campus: formData.studyCampus,
          gender: GENDER_OPTIONS.find((option) => option.value === formData.gender)?.label || formData.gender,
          admin_update_access: formData.allowAdminUpdates ? 'Allowed' : 'Not allowed',
          room_type: ROOM_TYPE_LABELS[formData.roomType] || formData.roomType,
          phone: formData.phone,
          payment_method: PAYMENT_METHODS.find((method) => method.value === formData.paymentMethod)?.label,
          amount_paid: formatCurrency(formData.amountPaid),
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
          <label htmlFor="campus">University Group</label>
          <input type="text" id="campus" name="campus" value={formData.campus} readOnly />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">Select your gender</option>
              {GENDER_OPTIONS.map((genderOption) => (
                <option key={genderOption.value} value={genderOption.value}>
                  {genderOption.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group consent-block">
            <label htmlFor="allowAdminUpdates">Admin update access</label>
            <label className="checkbox-card" htmlFor="allowAdminUpdates">
              <input
                type="checkbox"
                id="allowAdminUpdates"
                name="allowAdminUpdates"
                checked={formData.allowAdminUpdates}
                onChange={handleChange}
              />
              <span>Allow admin to update my account details if something goes wrong.</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="studyCampus">Study Campus</label>
          <select id="studyCampus" name="studyCampus" value={formData.studyCampus} onChange={handleChange} required>
            <option value="">Select your study campus</option>
            {campusOptions.map((campusOption) => (
              <option key={campusOption} value={campusOption}>
                {campusOption}
              </option>
            ))}
          </select>
        </div>

        <div className="payment-form-block">
          <div className="section-subtitle">
            <FaCreditCard />
            <div>
              <strong>Hostel payment details</strong>
              <p>Provide the payment method and reference so the admin can verify your rent before approval.</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="paymentReference">Transaction Reference</label>
              <input
                type="text"
                id="paymentReference"
                name="paymentReference"
                value={formData.paymentReference}
                onChange={handleChange}
                placeholder="Enter payment reference"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amountPaid">Hostel Rent Amount</label>
              <input type="number" id="amountPaid" name="amountPaid" value={formData.amountPaid} readOnly />
            </div>
            <div className="form-group">
              <label>Required amount</label>
              <div className="read-only-highlight">{formatCurrency(expectedRentAmount)}</div>
            </div>
          </div>
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
