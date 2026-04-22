import React from 'react';
import {
  FaUsers,
  FaBed,
  FaClipboardList,
  FaCreditCard,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaChartBar,
  FaKey,
  FaCog,
} from 'react-icons/fa';
import './DashboardSidebar.scss';

const DashboardSidebar = ({ activeView, onViewChange, stats, userType = 'admin', quickLinks = [] }) => {
  const adminCards = [
    {
      id: 'overview',
      label: 'Overview',
      icon: FaChartBar,
      count: stats.totalStudents || 0,
      description: 'Total students',
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: FaClipboardList,
      count: stats.totalApplications || 0,
      description: 'Total applications',
    },
    {
      id: 'pending-apps',
      label: 'Pending',
      icon: FaClock,
      count: stats.pendingApplications || 0,
      description: 'Awaiting review',
    },
    {
      id: 'payment-review',
      label: 'Payment Review',
      icon: FaCreditCard,
      count: stats.pendingPaymentReviews || 0,
      description: 'Payment verification',
    },
    {
      id: 'approved',
      label: 'Approved',
      icon: FaCheckCircle,
      count: stats.approvedApplications || 0,
      description: 'Room allocated',
    },
    {
      id: 'rooms',
      label: 'Rooms',
      icon: FaBed,
      count: stats.totalRooms || 0,
      description: 'Room inventory',
    },
    {
      id: 'waitlisted',
      label: 'Waitlisted',
      icon: FaExclamationCircle,
      count: stats.waitlistedApplications || 0,
      description: 'In queue',
    },
    {
      id: 'password-reset',
      label: 'Password Reset',
      icon: FaKey,
      count: stats.pendingPasswordResets || 0,
      description: 'Reset requests',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: FaCog,
      count: 0,
      description: 'Account & preferences',
    },
  ];

  const studentCards = [
    {
      id: 'application-status',
      label: 'Applied Hostel',
      icon: FaClipboardList,
      count: stats.totalApplications || 0,
      description: 'Room requests',
    },
    {
      id: 'payment-status',
      label: 'Paid Student',
      icon: FaCreditCard,
      count: stats.verifiedPayments || 0,
      description: 'Verified payments',
    },
    {
      id: 'room-info',
      label: 'Room Status',
      icon: FaBed,
      count: stats.roomsAvailable || 0,
      description: 'Room availability',
    },
    {
      id: 'profile',
      label: 'Registered Student',
      icon: FaUsers,
      count: 1,
      description: 'Account details',
    },
    {
      id: 'settings',
      label: 'Account Settings',
      icon: FaCog,
      count: 0,
      description: 'Theme and profile',
    },
  ];

  const cards = userType === 'admin' ? adminCards : studentCards;

  const handleCardClick = (cardId) => {
    onViewChange(cardId);
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-eyebrow">
          {userType === 'student' ? 'Student Sidebar' : 'Admin Sidebar'}
        </span>
        <div className="sidebar-header-top">
          <h3>{userType === 'student' ? 'My Portal Menu' : 'Portal Menu'}</h3>
        </div>
        <p className="sidebar-description">
          Use the left rail to jump between sections without losing your place.
        </p>
      </div>

      {quickLinks.length > 0 && (
        <section className="sidebar-quick-links" aria-label="Quick links">
          <div className="sidebar-section-title">Quick Links</div>
          <div className="sidebar-quick-link-grid">
            {quickLinks.map((link) => {
              const IconComponent = link.icon;

              return (
                <button
                  key={link.id}
                  type="button"
                  className="quick-link-card"
                  onClick={link.onClick}
                  aria-label={`${link.label}. ${link.description}`}
                  title={link.label}
                >
                  <div className="quick-link-icon">
                    <IconComponent />
                  </div>
                  <div className="quick-link-copy">
                    <strong>{link.label}</strong>
                    <span>{link.description}</span>
                  </div>
                  <span className="sr-only">
                    {link.label}. {link.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <nav className="sidebar-nav-grid">
        {cards.map((card) => {
          const IconComponent = card.icon;
          const isActive = activeView === card.id;

          return (
            <button
              key={card.id}
              className={`nav-card ${isActive ? 'active' : ''}`}
              onClick={() => handleCardClick(card.id)}
              aria-pressed={isActive}
            >
              <div className="nav-card-icon">
                <IconComponent />
              </div>
              <div className="nav-card-content">
                <div className="nav-card-label">{card.label}</div>
                <div className="nav-card-count">{card.count}</div>
                <div className="nav-card-description">{card.description}</div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
