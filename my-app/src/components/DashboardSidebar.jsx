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
} from 'react-icons/fa';
import './DashboardSidebar.scss';

const DashboardSidebar = ({ activeView, onViewChange, stats, userType = 'admin' }) => {
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
  ];

  const studentCards = [
    {
      id: 'application-status',
      label: 'Application',
      icon: FaClipboardList,
      count: stats.totalApplications || 0,
      description: 'Your applications',
    },
    {
      id: 'payment-status',
      label: 'Payment',
      icon: FaCreditCard,
      count: stats.paymentsPending || 0,
      description: 'Payment status',
    },
    {
      id: 'room-info',
      label: 'Room Info',
      icon: FaBed,
      count: stats.roomsAvailable || 0,
      description: 'Available rooms',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: FaUsers,
      count: 0,
      description: 'Your profile',
    },
  ];

  const cards = userType === 'admin' ? adminCards : studentCards;

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <h3>Quick Navigation</h3>
        <p className="sidebar-description">Click to view details</p>
      </div>

      <nav className="sidebar-nav-grid">
        {cards.map((card) => {
          const IconComponent = card.icon;
          const isActive = activeView === card.id;

          return (
            <button
              key={card.id}
              className={`nav-card ${isActive ? 'active' : ''}`}
              onClick={() => onViewChange(card.id)}
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
