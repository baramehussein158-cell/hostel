import React, { useEffect, useState } from 'react';
import {
  FaBed,
  FaChartBar,
  FaCheckCircle,
  FaClipboardList,
  FaMoon,
  FaSun,
  FaUsers,
} from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { APPLICATION_STATUS_LABELS } from '../data/portalData';
import './AdminPortal.scss';

const AdminPortal = ({
  onLogout,
  applications,
  roomInventory,
  registeredUsers,
  onUpdateRoom,
  onUpdateApplication,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [roomDrafts, setRoomDrafts] = useState({});
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [flash, setFlash] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRoomDrafts(
      roomInventory.reduce((drafts, room) => {
        drafts[room.id] = {
          total: room.total,
          status: room.status,
        };
        return drafts;
      }, {})
    );
  }, [roomInventory]);

  useEffect(() => {
    setAssignmentDrafts(
      applications.reduce((drafts, application) => {
        drafts[application.id] = application.assignedRoom ?? '';
        return drafts;
      }, {})
    );
  }, [applications]);

  useEffect(() => {
    if (!flash) {
      return undefined;
    }

    const timer = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  const totalRooms = roomInventory.reduce((sum, room) => sum + room.total, 0);
  const approvedApplications = applications.filter((application) => application.status === 'approved');
  const occupancyRate = totalRooms > 0 ? Math.round((approvedApplications.length / totalRooms) * 100) : 0;
  const openRoomGroups = roomInventory.filter((room) => room.status === 'open').length;
  const pendingApplications = applications.filter((application) => application.status === 'pending').length;

  const campusSummaries = ['UR', 'RP'].map((campus) => {
    const rooms = roomInventory.filter((room) => room.campus === campus);
    const total = rooms.reduce((sum, room) => sum + room.total, 0);
    const occupied = applications.filter(
      (application) => application.campus === campus && application.status === 'approved'
    ).length;
    const waiting = applications.filter(
      (application) =>
        application.campus === campus &&
        (application.status === 'pending' || application.status === 'waitlisted')
    ).length;

    return {
      campus,
      total,
      occupied,
      waiting,
      remaining: Math.max(total - occupied, 0),
    };
  });

  const filteredApplications = applications.filter((application) => {
    const campusMatches = campusFilter === 'ALL' || application.campus === campusFilter;
    const statusMatches = statusFilter === 'ALL' || application.status === statusFilter;
    return campusMatches && statusMatches;
  });

  const showFlash = (result) => {
    setFlash({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });
  };

  const getOccupiedCountForRoom = (room) =>
    applications.filter(
      (application) =>
        application.status === 'approved' &&
        application.campus === room.campus &&
        application.roomType === room.typeKey
    ).length;

  const handleRoomSave = async (roomId) => {
    setIsSaving(true);
    const result = await onUpdateRoom(roomId, {
      total: Number(roomDrafts[roomId]?.total ?? 0),
      status: roomDrafts[roomId]?.status ?? 'open',
    });
    setIsSaving(false);
    showFlash(result);
  };

  const handleApplicantAction = async (applicationId, status) => {
    setIsSaving(true);
    const result = await onUpdateApplication(applicationId, {
      status,
      assignedRoom: assignmentDrafts[applicationId]?.trim() ?? '',
    });
    setIsSaving(false);
    showFlash(result);
  };

  return (
    <div className={`admin-portal ${theme}`}>
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin Monitor</p>
          <h1>Housing operations dashboard</h1>
          <p className="admin-copy">
            Monitor room capacity, review student applications, and keep allocation decisions organized in one
            place.
          </p>
        </div>

        <div className="admin-actions">
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-content">
        {flash && <div className={`admin-flash ${flash.type}`}>{flash.message}</div>}

        <section className="admin-stat-grid">
          <article className="admin-card stat-card">
            <FaUsers className="stat-icon" />
            <span>Registered students</span>
            <strong>{registeredUsers.length}</strong>
          </article>
          <article className="admin-card stat-card">
            <FaClipboardList className="stat-icon" />
            <span>Total applications</span>
            <strong>{applications.length}</strong>
          </article>
          <article className="admin-card stat-card">
            <FaCheckCircle className="stat-icon" />
            <span>Approved allocations</span>
            <strong>{approvedApplications.length}</strong>
          </article>
          <article className="admin-card stat-card">
            <FaBed className="stat-icon" />
            <span>Open room groups</span>
            <strong>{openRoomGroups}</strong>
          </article>
        </section>

        <section className="admin-report-grid">
          <article className="admin-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Reports</p>
                <h2>Campus overview</h2>
              </div>
              <FaChartBar className="section-icon" />
            </div>

            <div className="campus-summary-grid">
              {campusSummaries.map((summary) => (
                <div key={summary.campus} className="campus-summary-card">
                  <strong>{summary.campus}</strong>
                  <span>{summary.remaining} rooms available</span>
                  <p>{summary.occupied} approved and {summary.waiting} still waiting for review.</p>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Status</p>
                <h2>Application pipeline</h2>
              </div>
              <FaClipboardList className="section-icon" />
            </div>

            <div className="pipeline-list">
              <div>
                <span>Pending review</span>
                <strong>{pendingApplications}</strong>
              </div>
              <div>
                <span>Waitlisted</span>
                <strong>{applications.filter((application) => application.status === 'waitlisted').length}</strong>
              </div>
              <div>
                <span>Rejected</span>
                <strong>{applications.filter((application) => application.status === 'rejected').length}</strong>
              </div>
              <div>
                <span>Occupancy</span>
                <strong>{occupancyRate}%</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="admin-layout">
          <article className="admin-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Manage rooms</p>
                <h2>Room inventory</h2>
              </div>
            </div>

            <div className="room-list">
              {roomInventory.map((room) => {
                const occupied = getOccupiedCountForRoom(room);
                const available = Math.max(room.total - occupied, 0);

                return (
                  <div key={room.id} className="room-row">
                    <div className="room-row-main">
                      <strong>
                        {room.campus} - {room.label}
                      </strong>
                      <span>
                        {occupied} occupied / {available} available
                      </span>
                    </div>

                    <div className="room-controls">
                      <label>
                        <span>Total rooms</span>
                        <input
                          type="number"
                          min="0"
                          value={roomDrafts[room.id]?.total ?? room.total}
                          disabled={isSaving}
                          onChange={(event) =>
                            setRoomDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [room.id]: {
                                ...currentDrafts[room.id],
                                total: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>

                      <label>
                        <span>Status</span>
                        <select
                          value={roomDrafts[room.id]?.status ?? room.status}
                          disabled={isSaving}
                          onChange={(event) =>
                            setRoomDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [room.id]: {
                                ...currentDrafts[room.id],
                                status: event.target.value,
                              },
                            }))
                          }
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                        </select>
                      </label>

                      <button type="button" className="action-button" disabled={isSaving} onClick={() => handleRoomSave(room.id)}>
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="admin-card">
            <div className="section-heading applicants-heading">
              <div>
                <p className="eyebrow">Manage applicants</p>
                <h2>Room applications</h2>
              </div>

              <div className="applicant-filters">
                <select value={campusFilter} onChange={(event) => setCampusFilter(event.target.value)}>
                  <option value="ALL">All campuses</option>
                  <option value="UR">UR</option>
                  <option value="RP">RP</option>
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="ALL">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="waitlisted">Waitlisted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="empty-state">No applications match the current filters yet.</div>
            ) : (
              <div className="application-list">
                {filteredApplications.map((application) => (
                  <div key={application.id} className="application-row">
                    <div className="application-main">
                      <div className="application-heading">
                        <strong>{application.name}</strong>
                        <span className={`status-pill ${application.status}`}>
                          {APPLICATION_STATUS_LABELS[application.status]}
                        </span>
                      </div>

                      <div className="application-meta">
                        <span>{application.regNumber}</span>
                        <span>{application.campus}</span>
                        <span>{application.roomType}</span>
                        <span>{new Date(application.submittedAt).toLocaleDateString()}</span>
                      </div>

                      <p>{application.email}</p>
                      <p>{application.phone}</p>
                    </div>

                    <div className="application-controls">
                      <input
                        type="text"
                        placeholder="Room number"
                        value={assignmentDrafts[application.id] ?? ''}
                        disabled={isSaving}
                        onChange={(event) =>
                          setAssignmentDrafts((currentDrafts) => ({
                            ...currentDrafts,
                            [application.id]: event.target.value,
                          }))
                        }
                      />

                      <div className="application-actions">
                        <button type="button" className="approve" disabled={isSaving} onClick={() => handleApplicantAction(application.id, 'approved')}>
                          Approve
                        </button>
                        <button type="button" className="waitlist" disabled={isSaving} onClick={() => handleApplicantAction(application.id, 'waitlisted')}>
                          Waitlist
                        </button>
                        <button type="button" className="reject" disabled={isSaving} onClick={() => handleApplicantAction(application.id, 'rejected')}>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  );
};

export default AdminPortal;
