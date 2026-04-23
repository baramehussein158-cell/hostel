import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import {
  FaBed,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaCreditCard,
  FaMoon,
  FaSearch,
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
  formatCurrency,
} from '../data/portalData';
import { PORTAL_IMAGES } from '../data/siteImages';
import { getLocalTimeLabel, getTimeGreeting } from '../utils/display';
import CampusCarousel from './CampusCarousel';
import HighlightText from './HighlightText';
import DashboardSidebar from './DashboardSidebar';
import Settings from './Settings';
import './Dashboard.scss';

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
  onUpdateProfile,
  session,
}) => {
  const campusName = campus === 'RP' ? 'Rwanda Polytechnic' : 'University of Rwanda';
  const { theme, changeTheme } = useTheme();
  const [activeView, setActiveView] = useState('application-status');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('status');
  const [notification, setNotification] = useState('');
  const [topSearch, setTopSearch] = useState('');
  const formRef = useRef(null);
  const statusRef = useRef(null);
  const displayName = student.name || session?.name || 'Student';
  const timeGreeting = getTimeGreeting();
  const currentTimeLabel = getLocalTimeLabel();
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const applicationStatus = latestApplication?.status ?? 'ready';
  const paymentStatus = latestApplication?.paymentStatus ?? 'pending';
  const hasApplication = Boolean(latestApplication);
  const canApply = !roomClosed && (!latestApplication || latestApplication.status === 'rejected');
  const verifiedPayments = studentApplications.filter((application) => application.paymentStatus === 'verified').length;
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
  const studentQuickLinks = [
    {
      id: 'quick-apply',
      label: 'Room Application',
      icon: FaBed,
      description: 'Open the application form',
      onClick: () => {
        setActiveView('application-status');
        setViewMode('form');
        setShowForm(true);
      },
    },
    {
      id: 'quick-status',
      label: 'Status Tracking',
      icon: FaClipboardList,
      description: 'Jump to the status summary',
      onClick: () => {
        setActiveView('application-status');
        setViewMode('status');
        setShowForm(false);
      },
    },
    {
      id: 'quick-deadline',
      label: 'Deadline Monitor',
      icon: FaCalendarAlt,
      description: deadline ? `Deadline: ${deadline.toLocaleDateString()}` : 'Review the application deadline',
      onClick: () => {
        setActiveView('application-status');
        setViewMode('status');
        setShowForm(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'quick-payment',
      label: 'Payment Verification',
      icon: FaCreditCard,
      description: 'Open payment status details',
      onClick: () => {
        setActiveView('payment-status');
        setShowForm(false);
        setViewMode('status');
      },
    },
  ];

  const dashboardSearchQuery = topSearch.trim().toLowerCase();
  const dashboardSearchResults = dashboardSearchQuery
    ? [
        {
          id: 'application-status',
          title: 'Application Status',
          description: `${statusCopy.title} - ${statusCopy.summary}`,
          detail: `${APPLICATION_STATUS_LABELS[applicationStatus]} | ${PAYMENT_STATUS_LABELS[paymentStatus]}`,
          keywords: [
            'application',
            'status',
            'room',
            'request',
            applicationStatus,
            paymentStatus,
            statusCopy.title,
            statusCopy.summary,
          ]
            .filter(Boolean)
            .join(' '),
          onClick: () => {
            setActiveView('application-status');
            setViewMode('status');
            setShowForm(false);
          },
        },
        {
          id: 'payment-status',
          title: 'Payment Status',
          description: `${paymentCopy.title} - ${paymentCopy.summary}`,
          detail: `${formatCurrency(latestApplication?.amountPaid)} | ${PAYMENT_STATUS_LABELS[paymentStatus]}`,
          keywords: [
            'payment',
            'rent',
            'verification',
            paymentStatus,
            paymentCopy.title,
            paymentCopy.summary,
            latestApplication?.paymentReference,
          ]
            .filter(Boolean)
            .join(' '),
          onClick: () => {
            setActiveView('payment-status');
            setViewMode('status');
            setShowForm(false);
          },
        },
        {
          id: 'room-info',
          title: 'Room Information',
          description: `${remainingRooms} rooms remaining and ${occupancyRate}% occupancy.`,
          detail: ROOM_TYPE_LABELS[latestApplication?.roomType] || 'Room allocation',
          keywords: [
            'room',
            'rooms',
            'occupancy',
            'allocation',
            'availability',
            remainingRooms,
            occupancyRate,
            latestApplication?.roomType,
          ]
            .filter(Boolean)
            .join(' '),
          onClick: () => {
            setActiveView('room-info');
            setViewMode('status');
            setShowForm(false);
          },
        },
        {
          id: 'profile',
          title: 'Profile',
          description: `${student.name} | ${student.email} | ${student.regNumber || 'No registration number'}`,
          detail: `Gender: ${profileGenderLabel}`,
          keywords: [student.name, student.email, student.regNumber, student.gender, 'profile', 'account']
            .filter(Boolean)
            .join(' '),
          onClick: () => {
            setActiveView('profile');
            setShowForm(false);
          },
        },
        {
          id: 'settings',
          title: 'Settings',
          description: 'Update your profile information and appearance preferences.',
          detail: 'Open account settings',
          keywords: ['settings', 'profile', 'theme', 'appearance', 'account', 'update']
            .filter(Boolean)
            .join(' '),
          onClick: () => {
            setActiveView('settings');
            setShowForm(false);
          },
        },
        ...studentQuickLinks.map((link) => ({
          id: link.id,
          title: link.label,
          description: link.description,
          detail: 'Quick link',
          keywords: [link.label, link.description, 'quick', 'link'].join(' '),
          onClick: link.onClick,
        })),
      ].filter((item) =>
        `${item.title} ${item.description} ${item.detail} ${item.keywords}`.toLowerCase().includes(dashboardSearchQuery)
      )
    : [];

  // Sidebar stats for students
  const studentSidebarStats = {
    totalApplications: studentApplications.length,
    verifiedPayments,
    roomsAvailable: remainingRooms,
  };

  const studentMetrics = [
    {
      id: 'applications-sent',
      label: 'Applications sent',
      value: studentApplications.length,
      icon: FaClipboardList,
    },
    {
      id: 'rooms-remaining',
      label: 'Rooms remaining',
      value: remainingRooms,
      icon: FaBed,
    },
    {
      id: 'latest-status',
      label: 'Latest status',
      value: hasApplication ? APPLICATION_STATUS_LABELS[latestApplication.status] : 'Ready',
      icon: FaCalendarAlt,
    },
    {
      id: 'payment-status',
      label: 'Payment',
      value: hasApplication ? PAYMENT_STATUS_LABELS[paymentStatus] : 'Not started',
      icon: FaCreditCard,
    },
  ];

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

  const handleApplicationSubmit = async (formData) => {
    const result = await onRoomApplication(formData);
    if (!result.success) {
      setNotification(result.message);
      return result;
    }

    setShowForm(false);
    setActiveView('application-status');
    setViewMode('status');
    setNotification('Your hostel application and payment details were submitted. Admin verification is now pending.');
    return result;
  };

  const handleViewChange = (nextView) => {
    setActiveView(nextView);

    if (nextView !== 'application-status') {
      setShowForm(false);
      setViewMode('status');
    }
  };

  return (
    <Box className={`dashboard ${theme} campus-${campus.toLowerCase()} student-dashboard`}>
      <header className="dashboard-header">
        <div className="dashboard-toolbar">
          <label className="portal-search">
            <FaSearch />
            <input
              type="search"
              value={topSearch}
              onChange={(event) => setTopSearch(event.target.value)}
              placeholder="Search..."
              aria-label="Search dashboard"
            />
          </label>

          <div className="dashboard-toolbar-actions">
            <button
              className="theme-toggle"
              onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
          </div>
        </div>

        <div className="header-main">
          <div className="hero-copy">
            <p className="eyebrow">CampusStay Student Portal</p>
            <h1>{timeGreeting}, {displayName}</h1>
            <p className="subheading">
              Manage your room application, submit payment details, and track admin decisions from one portal.
            </p>
            <p className="time-note">Local time: {currentTimeLabel}</p>
            <div className="campus-intro">
              <span className="campus-label">{campusName}</span>
            </div>
          </div>
        </div>
      </header>

      <Container maxWidth="xl" disableGutters className="student-dashboard-container">
        <section className="dashboard-campuses">
          <CampusCarousel
            slides={PORTAL_IMAGES}
            title="Campus highlights"
            description="A rotating visual tour of the same UR and RP images used on the landing page."
            variant="compact"
            className="dashboard-campus-carousel"
          />
        </section>

        <Grid container spacing={3} className="student-dashboard-layout">
          <Grid item xs={12} lg={3} className="student-dashboard-sidebar-column">
            <DashboardSidebar
              activeView={activeView}
              onViewChange={handleViewChange}
              stats={studentSidebarStats}
              userType="student"
              quickLinks={studentQuickLinks}
              searchQuery={topSearch}
              onLogout={onLogout}
            />
          </Grid>

          <Grid item xs={12} lg={9} className="student-dashboard-content-column">
            <Stack spacing={3} className="dashboard-content">
              {notification && (
                <Paper elevation={0} className="toast-notification">
                  <FaCheckCircle className="toast-icon" />
                  <span>{notification}</span>
                </Paper>
              )}

              {topSearch.trim() && (
                <Paper elevation={0} className="search-results-panel">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">Search results</p>
                      <h2>Matches for "{topSearch.trim()}"</h2>
                    </div>
                    <span className="search-results-count">{dashboardSearchResults.length} result(s)</span>
                  </div>

                  {dashboardSearchResults.length === 0 ? (
                    <div className="empty-state">
                      No dashboard matches found. Try a different word like payment, room, or profile.
                    </div>
                  ) : (
                    <Grid container spacing={2} className="search-results-grid">
                      {dashboardSearchResults.map((result) => (
                        <Grid item xs={12} sm={6} key={result.id}>
                          <button type="button" className="search-result-card" onClick={result.onClick}>
                            <span className="search-result-title">
                              <HighlightText text={result.title} query={topSearch} />
                            </span>
                            <span className="search-result-description">
                              <HighlightText text={result.description} query={topSearch} />
                            </span>
                            <span className="search-result-detail">
                              <HighlightText text={result.detail} query={topSearch} />
                            </span>
                          </button>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>
              )}

              {activeView === 'profile' ? (
                <Paper elevation={0} className="profile-panel">
                  <div className="profile-summary-card">
                    <div className="profile-summary-header">
                      <div className="avatar-large">{student.name?.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="eyebrow">Student Profile</p>
                        <h2>{student.name}</h2>
                        <p>Manage your personal details and account information.</p>
                      </div>
                    </div>

                    <div className="profile-details-grid">
                      <div>
                        <span>Name</span>
                        <strong>{student.name}</strong>
                      </div>
                      <div>
                        <span>Email</span>
                        <strong>{student.email}</strong>
                      </div>
                      <div>
                        <span>Registration</span>
                        <strong>{student.regNumber || 'Not set'}</strong>
                      </div>
                      <div>
                        <span>Campus</span>
                        <strong>{student.campus || 'Not set'}</strong>
                      </div>
                      <div>
                        <span>Gender</span>
                        <strong>{profileGenderLabel}</strong>
                      </div>
                      <div>
                        <span>Reset support</span>
                        <strong>Request reset code, then enter it in the login reset flow.</strong>
                      </div>
                    </div>
                  </div>
                </Paper>
              ) : activeView === 'payment-status' ? (
                <Grid container spacing={3} className="student-main-grid">
                  <Grid item xs={12} lg={8}>
                    <Paper elevation={0} className="overview-card">
                      <div className="card-header">
                        <div>
                          <p className="eyebrow">Payment view</p>
                          <h3>{paymentCopy.title}</h3>
                        </div>
                        <span className={`payment-status-badge ${paymentStatus}`}>
                          {hasApplication ? PAYMENT_STATUS_LABELS[paymentStatus] : 'Not started'}
                        </span>
                      </div>

                      <div className="status-summary">
                        <div>
                          <strong>{hasApplication ? formatCurrency(latestApplication.amountPaid) : 'No payment yet'}</strong>
                          <p>
                            {hasApplication
                              ? 'Hostel rent entered for the latest application.'
                              : 'Submit an application to add payment details.'}
                          </p>
                        </div>
                        <div>
                          <strong>{hasApplication ? latestApplication.paymentReference || 'No reference' : 'No reference'}</strong>
                          <p>{hasApplication ? 'Payment reference on record.' : 'Payment reference appears here after submission.'}</p>
                        </div>
                      </div>

                      {hasApplication ? (
                        <>
                          <div className="summary-block">
                            <div>
                              <span>Method</span>
                              <strong>
                                {PAYMENT_METHODS.find((method) => method.value === latestApplication.paymentMethod)?.label ||
                                  latestApplication.paymentMethod ||
                                  'Not captured'}
                              </strong>
                            </div>
                            <div>
                              <span>Status</span>
                              <strong>{PAYMENT_STATUS_LABELS[paymentStatus]}</strong>
                            </div>
                            <div>
                              <span>Hostel rent paid</span>
                              <strong>{formatCurrency(latestApplication.amountPaid)}</strong>
                            </div>
                            <div>
                              <span>Reviewed on</span>
                              <strong>
                                {latestApplication.paymentVerifiedAt
                                  ? new Date(latestApplication.paymentVerifiedAt).toLocaleDateString()
                                  : 'Waiting for review'}
                              </strong>
                            </div>
                          </div>

                          <div className="payment-progress-card">
                            <div className="payment-progress-copy">
                              <p className="eyebrow">Payment summary</p>
                              <h4>{paymentCopy.title}</h4>
                              <p>{paymentCopy.summary}</p>
                            </div>
                            <div className="payment-progress-meta">
                              <span className={`payment-status-badge ${paymentStatus}`}>
                                {PAYMENT_STATUS_LABELS[paymentStatus]}
                              </span>
                              <small>{verifiedPayments} verified payment(s)</small>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="summary-block empty">
                          <p>No payment record yet. Apply for a room first, then your payment status will appear here.</p>
                        </div>
                      )}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} lg={4}>
                    <Paper elevation={0} className="info-card">
                      <div className="info-header">
                        <h3>Payment steps</h3>
                      </div>
                      <ul>
                        <li>
                          <FaCreditCard /> Enter the hostel payment method and reference number.
                        </li>
                        <li>
                          <FaClock /> Wait for admin payment review.
                        </li>
                        <li>
                          <FaCheckCircle /> After verification, your hostel allocation can move forward.
                        </li>
                        <li>
                          <FaBed /> Check room assignment after approval.
                        </li>
                      </ul>
                    </Paper>
                  </Grid>
                </Grid>
              ) : activeView === 'room-info' ? (
                <Grid container spacing={3} className="student-main-grid">
                  <Grid item xs={12} lg={8}>
                    <Paper elevation={0} className="overview-card">
                      <div className="card-header">
                        <div>
                          <p className="eyebrow">Room view</p>
                          <h3>Room allocation and availability</h3>
                        </div>
                        <span className="status-badge approved">{remainingRooms} open</span>
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

                      <div className="summary-block" style={{ marginTop: '1.5rem' }}>
                        <div>
                          <span>Latest room type</span>
                          <strong>
                            {hasApplication ? ROOM_TYPE_LABELS[latestApplication.roomType] || latestApplication.roomType : 'Not set'}
                          </strong>
                        </div>
                        <div>
                          <span>Assigned room</span>
                          <strong>{hasApplication ? latestApplication.assignedRoom || 'Waiting for admin assignment' : 'Not assigned'}</strong>
                        </div>
                        <div>
                          <span>Room request</span>
                          <strong>{hasApplication ? APPLICATION_STATUS_LABELS[latestApplication.status] : 'No application yet'}</strong>
                        </div>
                        <div>
                          <span>Deadline</span>
                          <strong>{deadline.toLocaleDateString()}</strong>
                        </div>
                      </div>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} lg={4}>
                    <Paper elevation={0} className="info-card">
                      <div className="info-header">
                        <h3>Room checklist</h3>
                      </div>
                      <ul>
                        <li>
                          <FaClipboardList /> Submit the hostel application first.
                        </li>
                        <li>
                          <FaCreditCard /> Make sure payment details are verified.
                        </li>
                        <li>
                          <FaCheckCircle /> Approved students can receive a room assignment.
                        </li>
                        <li>
                          <FaBed /> Check this section when you want to confirm room status.
                        </li>
                      </ul>
                    </Paper>
                  </Grid>
                </Grid>
              ) : activeView === 'settings' ? (
                <Settings user={student} userType="student" onUpdateProfile={onUpdateProfile} />
              ) : (
                <>
                  <Grid container spacing={3} className="student-hero-grid">
                    <Grid item xs={12} lg={8}>
                      <Paper elevation={0} className="hero-panel">
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
                      </Paper>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                      <Grid container spacing={2} className="metric-cards">
                        {studentMetrics.map((metric) => {
                          const MetricIcon = metric.icon;

                          return (
                            <Grid item xs={12} sm={6} key={metric.id}>
                              <Paper elevation={0} className="metric-card">
                                <MetricIcon className="metric-icon" />
                                <span>{metric.label}</span>
                                <strong>{metric.value}</strong>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid container spacing={3} className="student-main-grid">
                    <Grid item xs={12} lg={8}>
                      <Paper elevation={0} ref={statusRef} className="overview-card">
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
                      </Paper>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                      <Paper elevation={0} className="info-card">
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
                      </Paper>
                    </Grid>
                  </Grid>

                  {showForm && (
                    <Box ref={formRef} className="form-anchor">
                      <ApplicationForm student={student} onBack={() => setShowForm(false)} onSubmit={handleApplicationSubmit} />
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
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
