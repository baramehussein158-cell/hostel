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
  FaSignOutAlt,
  FaUser,
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import HighlightText from './HighlightText';
import './DashboardSidebar.scss';

const DashboardSidebar = ({
  activeView,
  onViewChange,
  stats,
  userType = 'admin',
  quickLinks = [],
  onLogout,
  searchQuery = '',
}) => {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const totalApplications = stats.totalApplications || 0;
  const totalRooms = stats.totalRooms || 0;
  const approvedApplications = stats.approvedApplications || 0;
  const pendingApplications = stats.pendingApplications || 0;
  const pendingPaymentReviews = stats.pendingPaymentReviews || 0;
  const waitlistedApplications = stats.waitlistedApplications || 0;
  const occupancyRate = totalRooms > 0 ? Math.round((approvedApplications / totalRooms) * 100) : 0;
  const approvalRate = totalApplications > 0 ? Math.round((approvedApplications / totalApplications) * 100) : 0;
  const reviewLoad = totalApplications > 0 ? Math.round(((pendingApplications + pendingPaymentReviews) / totalApplications) * 100) : 0;
  const chartSeries =
    userType === 'admin'
      ? [
          {
            id: 'occupancy',
            label: 'Room occupancy',
            shortLabel: 'Occupancy',
            value: occupancyRate,
            color: '#0f766e',
            note: `${approvedApplications}/${totalRooms || 0} rooms filled`,
          },
          {
            id: 'approval',
            label: 'Approval rate',
            shortLabel: 'Approval',
            value: approvalRate,
            color: '#2563eb',
            note: `${approvedApplications} approved applications`,
          },
          {
            id: 'review-load',
            label: 'Review load',
            shortLabel: 'Review',
            value: reviewLoad,
            color: '#7c3aed',
            note: `${pendingApplications + pendingPaymentReviews} waiting for action`,
          },
          {
            id: 'waitlist',
            label: 'Waitlist pressure',
            shortLabel: 'Waitlist',
            value: totalApplications > 0 ? Math.round((waitlistedApplications / totalApplications) * 100) : 0,
            color: '#f59e0b',
            note: `${waitlistedApplications} students in queue`,
          },
        ]
      : [];

  const adminCards = [
    {
      id: 'overview',
      label: 'Overview',
      icon: FaChartBar,
      count: stats.totalStudents || 0,
      description: 'Total students',
    },
    {
      id: 'students',
      label: 'Students',
      icon: FaUsers,
      count: stats.totalStudents || 0,
      description: 'View and manage accounts',
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
      icon: FaUser,
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

  const renderCard = (card, compact = false) => {
    const IconComponent = card.icon;
    const isActive = activeView === card.id;
    const isSearchMatched =
      Boolean(normalizedSearch) &&
      [card.label, card.description].some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch));

    return (
      <button
        key={card.id}
        type="button"
        className={`sidebar-nav-item ${compact ? 'compact' : ''} ${isActive ? 'active' : ''} ${
          isSearchMatched ? 'search-match' : ''
        }`}
        onClick={() => handleCardClick(card.id)}
        aria-pressed={isActive}
      >
        <span className="sidebar-nav-icon">
          <IconComponent />
        </span>
        <span className="sidebar-nav-copy">
          <strong>
            <HighlightText text={card.label} query={normalizedSearch} />
          </strong>
          <span>
            <HighlightText text={card.description} query={normalizedSearch} />
          </span>
        </span>
        <span className="sidebar-nav-badge">{card.count}</span>
      </button>
    );
  };

  return (
    <aside className={`dashboard-sidebar dashboard-sidebar--${userType}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark" aria-hidden="true">
          <span>CS</span>
        </div>
        <div className="sidebar-brand-copy">
          <span className="sidebar-eyebrow">{userType === 'student' ? 'Student Portal' : 'Admin Portal'}</span>
          <h3>CampusStay</h3>
          <p>{userType === 'student' ? 'Track your room journey' : 'Manage hostel operations'}</p>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Dashboard</div>
        <div className="sidebar-nav-list">{primaryCards.map((card) => renderCard(card))}</div>
      </div>

      {secondaryCards.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">{userType === 'student' ? 'More' : 'Workspace'}</div>
          <div className="sidebar-nav-list sidebar-nav-list--compact">
            {secondaryCards.map((card) => renderCard(card, true))}
          </div>
        </div>
      )}

      {userType === 'admin' && (
        <div className="sidebar-section sidebar-analysis-panel">
          <div className="sidebar-section-title">Chart Analysis</div>
          <div className="sidebar-analysis-summary">
            <div>
              <span>Occupancy</span>
              <strong>{occupancyRate}%</strong>
            </div>
            <div>
              <span>Approval</span>
              <strong>{approvalRate}%</strong>
            </div>
            <div>
              <span>Review load</span>
              <strong>{reviewLoad}%</strong>
            </div>
          </div>

          <div className="sidebar-chart-shell">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartSeries} margin={{ top: 12, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="shortLabel"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) {
                      return null;
                    }

                    const item = payload[0].payload;

                    return (
                      <div className="sidebar-chart-tooltip">
                        <strong>{item.label}</strong>
                        <span>{item.note}</span>
                        <em>{Math.min(item.value, 100)}%</em>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={36}>
                  {chartSeries.map((item) => (
                    <Cell key={item.id} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="sidebar-chart-list" role="img" aria-label="Admin dashboard chart analysis">
            {chartSeries.map((item) => (
              <div key={item.id} className="sidebar-chart-row">
                <div className="sidebar-chart-copy">
                  <strong>{item.label}</strong>
                  <span>{item.note}</span>
                </div>
                <div className="sidebar-chart-track" aria-hidden="true">
                  <div className="sidebar-chart-fill" style={{ width: `${Math.min(item.value, 100)}%` }} />
                </div>
                <span className="sidebar-chart-percent">{Math.min(item.value, 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {quickLinks.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Quick Links</div>
          <div className="sidebar-nav-list sidebar-quick-list">
            {quickLinks.map((link) => {
              const IconComponent = link.icon;

              return (
                <button
                  key={link.id}
                  type="button"
                  className={`sidebar-quick-item ${
                    normalizedSearch &&
                    [link.label, link.description]
                      .some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch))
                      ? 'search-match'
                      : ''
                  }`}
                  onClick={link.onClick}
                  aria-label={`${link.label}. ${link.description}`}
                  title={link.label}
                >
                  <span className="sidebar-nav-icon">
                    <IconComponent />
                  </span>
                  <span className="sidebar-nav-copy">
                    <strong>
                      <HighlightText text={link.label} query={normalizedSearch} />
                    </strong>
                    <span>
                      <HighlightText text={link.description} query={normalizedSearch} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {onLogout && (
        <button type="button" className="sidebar-logout" onClick={onLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      )}
    </aside>
  );
};

export default DashboardSidebar;
