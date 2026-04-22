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
  const primaryCards = cards.slice(0, userType === 'admin' ? 5 : 3);
  const secondaryCards = cards.slice(userType === 'admin' ? 5 : 3);

  const handleCardClick = (cardId) => {
    onViewChange?.(cardId);
  };

  return (
    <aside className={`dashboard-sidebar dashboard-sidebar--${userType}`}>
      <div className="sidebar-shell">
        <div className="sidebar-rail" aria-label="Sidebar shortcuts">
          <div className="sidebar-brand-mark" aria-hidden="true">
            <span className="sidebar-brand-initials">CS</span>
          </div>

          <nav className="sidebar-rail-nav" aria-label="Primary sections">
            {primaryCards.map((card) => {
              const IconComponent = card.icon;
              const isActive = activeView === card.id;

              return (
                <button
                  key={card.id}
                  type="button"
                  className={`sidebar-rail-button ${isActive ? 'active' : ''}`}
                  onClick={() => handleCardClick(card.id)}
                  aria-pressed={isActive}
                  aria-label={card.label}
                  title={card.label}
                >
                  <IconComponent />
                </button>
              );
            })}
          </nav>

          <div className="sidebar-rail-footer" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="sidebar-panel">
          <header className="sidebar-brand">
            <div className="sidebar-brand-copy">
              <span className="sidebar-eyebrow">
                {userType === 'student' ? 'Student Portal' : 'Admin Portal'}
              </span>
              <h3>CampusStay</h3>
              <p>{userType === 'student' ? 'Track your room journey' : 'Manage hostel operations'}</p>
            </div>
            <div className="sidebar-status-chip">Live</div>
          </header>

          <section className="sidebar-section" aria-label="Explore navigation">
            <div className="sidebar-section-title">Explore Task</div>
            <div className="sidebar-menu-list">
              {primaryCards.map((card) => {
                const IconComponent = card.icon;
                const isActive = activeView === card.id;

                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleCardClick(card.id)}
                    aria-pressed={isActive}
                  >
                    <span className="sidebar-menu-icon">
                      <IconComponent />
                    </span>
                    <span className="sidebar-menu-copy">
                      <strong>{card.label}</strong>
                      <span>{card.description}</span>
                    </span>
                    <span className="sidebar-menu-badge">{card.count}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {secondaryCards.length > 0 && (
            <section className="sidebar-section sidebar-section-muted" aria-label="More navigation">
              <div className="sidebar-section-title">
                {userType === 'student' ? 'More' : 'Workspace'}
              </div>
              <div className="sidebar-menu-list sidebar-menu-list-compact">
                {secondaryCards.map((card) => {
                  const IconComponent = card.icon;
                  const isActive = activeView === card.id;

                  return (
                    <button
                      key={card.id}
                      type="button"
                      className={`sidebar-menu-item sidebar-menu-item-compact ${isActive ? 'active' : ''}`}
                      onClick={() => handleCardClick(card.id)}
                      aria-pressed={isActive}
                    >
                      <span className="sidebar-menu-icon">
                        <IconComponent />
                      </span>
                      <span className="sidebar-menu-copy">
                        <strong>{card.label}</strong>
                        <span>{card.description}</span>
                      </span>
                      <span className="sidebar-menu-badge">{card.count}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {quickLinks.length > 0 && (
            <section className="sidebar-section sidebar-section-muted" aria-label="Quick links">
              <div className="sidebar-section-title">Quick Links</div>
              <div className="sidebar-quick-link-list">
                {quickLinks.map((link) => {
                  const IconComponent = link.icon;

                  return (
                    <button
                      key={link.id}
                      type="button"
                      className="sidebar-quick-link"
                      onClick={link.onClick}
                      aria-label={`${link.label}. ${link.description}`}
                      title={link.label}
                    >
                      <span className="sidebar-menu-icon sidebar-quick-link-icon">
                        <IconComponent />
                      </span>
                      <span className="sidebar-quick-link-copy">
                        <strong>{link.label}</strong>
                        <span>{link.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
