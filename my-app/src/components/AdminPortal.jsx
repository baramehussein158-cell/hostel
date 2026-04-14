import React, { useEffect, useMemo, useState } from 'react';
import {
  FaBed,
  FaChartBar,
  FaCheckCircle,
  FaClipboardList,
  FaCreditCard,
  FaKey,
  FaMoon,
  FaSearch,
  FaSun,
  FaUsers,
} from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import {
  APPLICATION_STATUS_LABELS,
  ADMIN_UPDATE_ACCESS_LABELS,
  GENDER_OPTIONS,
  PASSWORD_RESET_REQUEST_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_STATUS_LABELS,
  ROOM_TYPE_LABELS,
  buildProfileImageSrc,
  formatCurrency,
  getUserAccountKey,
  sortApplicationsByDate,
} from '../data/portalData';
import './AdminPortal.scss';

const AdminPortal = ({
  onLogout,
  applications,
  roomInventory,
  registeredUsers,
  passwordResetRequests,
  onUpdateRoom,
  onUpdateApplication,
  onResetStudentPassword,
  onUpdateStudent,
  onDeleteStudent,
  onReviewPasswordResetRequest,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [roomDrafts, setRoomDrafts] = useState({});
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [paymentNotesDrafts, setPaymentNotesDrafts] = useState({});
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentDraft, setSelectedStudentDraft] = useState({
    name: '',
    email: '',
    regNumber: '',
    campus: 'UR',
    gender: '',
  });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [studentCampusFilter, setStudentCampusFilter] = useState('ALL');
  const [studentSearch, setStudentSearch] = useState('');
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
    setPaymentNotesDrafts(
      applications.reduce((drafts, application) => {
        drafts[application.id] = application.paymentVerificationNotes ?? '';
        return drafts;
      }, {})
    );
  }, [applications]);

  useEffect(() => {
    if (registeredUsers.length === 0) {
      setSelectedStudentId('');
      return;
    }

    if (!selectedStudentId || !registeredUsers.some((user) => user.id === selectedStudentId)) {
      setSelectedStudentId(registeredUsers[0].id);
    }
  }, [registeredUsers, selectedStudentId]);

  useEffect(() => {
    if (!flash) {
      return undefined;
    }

    const timer = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  const totalRooms = roomInventory.reduce((sum, room) => sum + room.total, 0);
  const approvedApplications = applications.filter((application) => application.status === 'approved');
  const verifiedPayments = applications.filter((application) => application.paymentStatus === 'verified');
  const pendingPasswordResetRequests = passwordResetRequests.filter(
    (request) => request.status === 'pending'
  ).length;
  const pendingApplications = applications.filter((application) => application.status === 'pending').length;
  const pendingPaymentReviews = applications.filter(
    (application) => (application.paymentStatus ?? 'pending') === 'pending'
  ).length;
  const occupancyRate = totalRooms > 0 ? Math.round((approvedApplications.length / totalRooms) * 100) : 0;
  const openRoomGroups = roomInventory.filter((room) => room.status === 'open').length;
  const usersById = new Map(registeredUsers.map((user) => [user.id, user]));
  const usersByRegNumber = new Map(
    registeredUsers.map((user) => [user.regNumber?.toLowerCase(), user]).filter(([regNumber]) => Boolean(regNumber))
  );
  const usersByEmail = new Map(
    registeredUsers.map((user) => [user.email?.toLowerCase(), user]).filter(([email]) => Boolean(email))
  );

  const campusSummaries = ['UR', 'RP'].map((campus) => {
    const rooms = roomInventory.filter((room) => room.campus === campus);
    const totalRooms = rooms.reduce((sum, room) => sum + room.total, 0);
    const openRooms = rooms.filter((room) => room.status === 'open').reduce((sum, room) => sum + room.total, 0);
    const occupiedRooms = applications.filter(
      (application) => application.campus === campus && application.status === 'approved'
    ).length;
    const waitingApplications = applications.filter(
      (application) =>
        application.campus === campus &&
        (application.status === 'pending' || application.status === 'waitlisted')
    ).length;
    const verifiedPayments = applications.filter(
      (application) => application.campus === campus && application.paymentStatus === 'verified'
    ).length;
    const availableRooms = Math.max(openRooms - occupiedRooms, 0);
    const remainingRooms = Math.max(totalRooms - occupiedRooms, 0);

    return {
      campus,
      totalRooms,
      openRooms,
      occupiedRooms,
      availableRooms,
      remainingRooms,
      waitingApplications,
      verifiedPayments,
    };
  });

  const filteredApplications = applications.filter((application) => {
    const campusMatches = campusFilter === 'ALL' || application.campus === campusFilter;
    const statusMatches = statusFilter === 'ALL' || application.status === statusFilter;
    return campusMatches && statusMatches;
  });

  const filteredStudents = useMemo(() => {
    const searchTerm = studentSearch.trim().toLowerCase();

    return registeredUsers.filter((user) => {
      const campusMatches = studentCampusFilter === 'ALL' || user.campus === studentCampusFilter;
      if (!campusMatches) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return [user.name, user.email, user.regNumber, user.gender].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(searchTerm)
      );
    });
  }, [registeredUsers, studentCampusFilter, studentSearch]);

  const selectedStudent = useMemo(
    () => filteredStudents.find((student) => student.id === selectedStudentId) ?? filteredStudents[0] ?? null,
    [filteredStudents, selectedStudentId]
  );

  useEffect(() => {
    if (!selectedStudent) {
      setSelectedStudentDraft({
        name: '',
        email: '',
        regNumber: '',
        campus: 'UR',
        gender: '',
      });
      return;
    }

    setSelectedStudentId(selectedStudent.id);
    setSelectedStudentDraft({
      name: selectedStudent.name ?? '',
      email: selectedStudent.email ?? '',
      regNumber: selectedStudent.regNumber ?? '',
      campus: selectedStudent.campus ?? 'UR',
      gender: selectedStudent.gender ?? '',
    });
  }, [selectedStudent]);

  const paymentInbox = useMemo(
    () =>
      sortApplicationsByDate(
        applications.filter((application) => application.paymentSubmittedAt || application.paymentStatus !== 'pending')
      ).slice(0, 5),
    [applications]
  );

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

  const getStudentForApplication = (application) =>
    usersById.get(application.studentId) ||
    usersByRegNumber.get(application.regNumber?.toLowerCase()) ||
    usersByEmail.get(application.email?.toLowerCase()) ||
    null;

  const getLatestApplicationForStudent = (user) => {
    const accountKey = getUserAccountKey(user);
    return (
      sortApplicationsByDate(
        applications.filter((application) => {
          const applicationAccountKey =
            application.studentAccountKey ||
            getUserAccountKey({
              campus: application.campus,
              regNumber: application.regNumber,
              email: application.email,
            });

          return (
            application.studentId === user.id ||
            (accountKey && applicationAccountKey === accountKey) ||
            application.regNumber?.toLowerCase() === user.regNumber?.toLowerCase() ||
            application.email?.toLowerCase() === user.email?.toLowerCase()
          );
        })
      )[0] ?? null
    );
  };

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
      paymentVerificationNotes: paymentNotesDrafts[applicationId]?.trim() ?? '',
    });
    setIsSaving(false);
    showFlash(result);
  };

  const handlePaymentReview = async (applicationId, paymentStatus) => {
    setIsSaving(true);
    const result = await onUpdateApplication(applicationId, {
      paymentStatus,
      assignedRoom: assignmentDrafts[applicationId]?.trim() ?? '',
      paymentVerificationNotes: paymentNotesDrafts[applicationId]?.trim() ?? '',
    });
    setIsSaving(false);
    showFlash(result);
  };

  const handlePasswordReset = async (userId) => {
    const nextPassword = passwordDrafts[userId]?.trim() ?? '';
    if (!nextPassword) {
      showFlash({ success: false, message: 'Enter the new student password before saving.' });
      return;
    }

    setIsSaving(true);
    const result = await onResetStudentPassword({ userId, nextPassword });
    setIsSaving(false);
    showFlash(result);

    if (result.success) {
      setPasswordDrafts((currentDrafts) => ({
        ...currentDrafts,
        [userId]: '',
      }));
    }
  };

  const handleSelectedStudentSave = async () => {
    if (!selectedStudent) {
      showFlash({ success: false, message: 'Select a student first.' });
      return;
    }

    setIsSaving(true);
    const result = await onUpdateStudent(selectedStudent.id, selectedStudentDraft);
    setIsSaving(false);
    showFlash(result);
  };

  const handleSelectedStudentDelete = async () => {
    if (!selectedStudent) {
      showFlash({ success: false, message: 'Select a student first.' });
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedStudent.name}'s account and related applications?`);
    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    const result = await onDeleteStudent(selectedStudent.id);
    setIsSaving(false);
    showFlash(result);

    if (result.success) {
      setSelectedStudentId('');
    }
  };

  return (
    <div className={`admin-portal ${theme}`}>
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin Monitor</p>
          <h1>Housing operations dashboard</h1>
          <p className="admin-copy">
            Monitor registrations, verify hostel rent payments, approve qualified students, and support account
            recovery from one place.
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

      <section className="admin-campus-strip" aria-label="Campus room summary">
        {campusSummaries.map((summary) => (
          <article key={summary.campus} className="admin-campus-card">
            <div className="admin-campus-card-head">
              <div>
                <p className="eyebrow">Campus summary</p>
                <h2>{summary.campus}</h2>
              </div>
              <span className="campus-total-pill">{summary.totalRooms} total</span>
            </div>

            <div className="admin-campus-metrics">
              <div>
                <span>Open capacity</span>
                <strong>{summary.openRooms}</strong>
              </div>
              <div>
                <span>Available now</span>
                <strong>{summary.availableRooms}</strong>
              </div>
              <div>
                <span>Approved</span>
                <strong>{summary.occupiedRooms}</strong>
              </div>
              <div>
                <span>Remaining</span>
                <strong>{summary.remainingRooms}</strong>
              </div>
            </div>

            <p>
              {summary.waitingApplications} waiting application(s) and {summary.verifiedPayments} verified payment(s)
              are linked to this campus.
            </p>
          </article>
        ))}
      </section>

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
            <FaCreditCard className="stat-icon" />
            <span>Verified payments</span>
            <strong>{verifiedPayments.length}</strong>
          </article>
          <article className="admin-card stat-card">
            <FaCheckCircle className="stat-icon" />
            <span>Approved allocations</span>
            <strong>{approvedApplications.length}</strong>
          </article>
          <article className="admin-card stat-card">
            <FaKey className="stat-icon" />
            <span>Password requests</span>
            <strong>{pendingPasswordResetRequests}</strong>
          </article>
          <article className="admin-card stat-card">
            <FaBed className="stat-icon" />
            <span>Open room groups</span>
            <strong>{openRoomGroups}</strong>
          </article>
        </section>

        <section className="admin-card payment-inbox-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Payment inbox</p>
              <h2>Latest student payment messages</h2>
            </div>
            <FaCreditCard className="section-icon" />
          </div>

          {paymentInbox.length === 0 ? (
            <div className="empty-state">No recent payment submissions are waiting for review.</div>
          ) : (
            <div className="payment-inbox-list">
              {paymentInbox.map((application) => {
                const paymentStatus = application.paymentStatus ?? 'pending';
                return (
                  <div key={application.id} className="payment-inbox-row">
                    <div>
                      <strong>{application.name}</strong>
                      <span>
                        {PAYMENT_METHODS.find((method) => method.value === application.paymentMethod)?.label ||
                          application.paymentMethod ||
                          'Payment method not set'}
                      </span>
                    </div>
                    <div>
                      <span>{formatCurrency(application.amountPaid)}</span>
                      <strong className={`payment-pill ${paymentStatus}`}>
                        {PAYMENT_STATUS_LABELS[paymentStatus]}
                      </strong>
                    </div>
                    <p>
                      Submitted on {new Date(application.paymentSubmittedAt || application.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="admin-card password-reset-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Password reset requests</p>
              <h2>One-time code approvals</h2>
            </div>
            <FaKey className="section-icon" />
          </div>

          {passwordResetRequests.length === 0 ? (
            <div className="empty-state">No password reset requests have been submitted yet.</div>
          ) : (
            <div className="password-reset-list">
              {passwordResetRequests.map((request) => {
                const statusLabel = PASSWORD_RESET_REQUEST_STATUS_LABELS[request.status] || 'Pending';

                return (
                  <div key={request.id} className="password-reset-row">
                    <div className="password-reset-main">
                      <div className="password-reset-heading">
                        <strong>{request.name}</strong>
                        <span className={`status-pill ${request.status}`}>{statusLabel}</span>
                      </div>

                      <div className="password-reset-meta">
                        <span>{request.email}</span>
                        <span>{request.regNumber}</span>
                        <span>{request.campus}</span>
                        <span>Gender: {GENDER_OPTIONS.find((item) => item.value === request.gender)?.label || request.gender || 'Not set'}</span>
                      </div>

                      {request.reason && <p className="password-reset-reason">Reason: {request.reason}</p>}

                      <div className="password-reset-code">
                        <span>One-time code</span>
                        <strong>{request.resetCode || 'Not issued yet'}</strong>
                      </div>

                      <div className="password-reset-dates">
                        <span>Requested: {new Date(request.requestedAt).toLocaleDateString()}</span>
                        <span>Issued: {request.resetCodeIssuedAt ? new Date(request.resetCodeIssuedAt).toLocaleDateString() : 'Not yet'}</span>
                        <span>Expires: {request.resetCodeExpiresAt ? new Date(request.resetCodeExpiresAt).toLocaleDateString() : 'Not yet'}</span>
                      </div>
                    </div>

                    <div className="password-reset-actions">
                      <button
                        type="button"
                        className="action-button"
                        disabled={isSaving || request.status === 'used'}
                        onClick={() => onReviewPasswordResetRequest(request.id, 'approve')}
                      >
                        {request.status === 'approved' ? 'Reissue Code' : 'Approve & Generate Code'}
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        disabled={isSaving || request.status === 'used'}
                        onClick={() => onReviewPasswordResetRequest(request.id, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                  <div className="campus-summary-metrics">
                    <div>
                      <span>Total rooms</span>
                      <strong>{summary.totalRooms}</strong>
                    </div>
                    <div>
                      <span>Open capacity</span>
                      <strong>{summary.openRooms}</strong>
                    </div>
                    <div>
                      <span>Available now</span>
                      <strong>{summary.availableRooms}</strong>
                    </div>
                    <div>
                      <span>Remaining</span>
                      <strong>{summary.remainingRooms}</strong>
                    </div>
                  </div>
                  <p>
                    {summary.occupiedRooms} approved, {summary.waitingApplications} waiting, and{' '}
                    {summary.verifiedPayments} payments already verified.
                  </p>
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
                <span>Payment checks pending</span>
                <strong>{pendingPaymentReviews}</strong>
              </div>
              <div>
                <span>Waitlisted</span>
                <strong>{applications.filter((application) => application.status === 'waitlisted').length}</strong>
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

                      <button
                        type="button"
                        className="action-button"
                        disabled={isSaving}
                        onClick={() => handleRoomSave(room.id)}
                      >
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
                {filteredApplications.map((application) => {
                  const matchedStudent = getStudentForApplication(application);
                  const studentProfileImage = buildProfileImageSrc(
                    matchedStudent?.profileImageUrl,
                    matchedStudent?.profileImageUpdatedAt
                  );
                  const paymentStatus = application.paymentStatus ?? 'pending';
                  const canApprove = paymentStatus === 'verified';

                  return (
                    <div key={application.id} className="application-row">
                      <div className="application-main">
                        <div className="application-heading">
                          <div className="applicant-profile">
                            <div className="applicant-avatar">
                              {studentProfileImage ? (
                                <img src={studentProfileImage} alt={`${application.name} profile`} />
                              ) : (
                                application.name?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <strong>{application.name}</strong>
                              <span>{application.email}</span>
                            </div>
                          </div>
                          <div className="status-pill-stack">
                            <span className={`status-pill ${application.status}`}>
                              {APPLICATION_STATUS_LABELS[application.status]}
                            </span>
                            <span className={`payment-pill ${paymentStatus}`}>
                              {PAYMENT_STATUS_LABELS[paymentStatus]}
                            </span>
                          </div>
                        </div>

                        <div className="application-meta">
                          <span>{application.regNumber}</span>
                          <span>{application.campus}</span>
                          <span>
                            Gender:{' '}
                            {GENDER_OPTIONS.find((item) => item.value === application.gender)?.label ||
                              application.gender ||
                              'Not set'}
                          </span>
                          <span>{application.studyCampus || 'Study campus not set'}</span>
                          <span>{ROOM_TYPE_LABELS[application.roomType] || application.roomType}</span>
                          <span>{new Date(application.submittedAt).toLocaleDateString()}</span>
                        </div>

                        <div className="payment-summary-grid">
                          <span>
                            Method:{' '}
                            {PAYMENT_METHODS.find((method) => method.value === application.paymentMethod)?.label ||
                              application.paymentMethod ||
                              'Not set'}
                          </span>
                          <span>Reference: {application.paymentReference || 'Not set'}</span>
                          <span>Amount: {formatCurrency(application.amountPaid)}</span>
                          <span>Due: {formatCurrency(application.expectedRentAmount)}</span>
                        </div>

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

                        <textarea
                          className="notes-field"
                          rows="3"
                          placeholder="Payment or approval notes"
                          value={paymentNotesDrafts[application.id] ?? ''}
                          disabled={isSaving}
                          onChange={(event) =>
                            setPaymentNotesDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [application.id]: event.target.value,
                            }))
                          }
                        />

                        <div className="application-actions payment-actions">
                          <button
                            type="button"
                            className="verify"
                            disabled={isSaving}
                            onClick={() => handlePaymentReview(application.id, 'verified')}
                          >
                            Verify Payment
                          </button>
                          <button
                            type="button"
                            className="payment-reject"
                            disabled={isSaving}
                            onClick={() => handlePaymentReview(application.id, 'rejected')}
                          >
                            Reject Payment
                          </button>
                        </div>

                        <div className="application-actions">
                          <button
                            type="button"
                            className="approve"
                            disabled={isSaving || !canApprove}
                            onClick={() => handleApplicantAction(application.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="waitlist"
                            disabled={isSaving}
                            onClick={() => handleApplicantAction(application.id, 'waitlisted')}
                          >
                            Waitlist
                          </button>
                          <button
                            type="button"
                            className="reject"
                            disabled={isSaving}
                            onClick={() => handleApplicantAction(application.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>

        <section className="student-directory-section">
          <article className="admin-card">
            <div className="section-heading applicants-heading">
              <div>
                <p className="eyebrow">Student accounts</p>
                <h2>Registered students and password support</h2>
              </div>

              <div className="student-tools">
                <label className="student-search">
                  <FaSearch />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search name, email, or reg number"
                  />
                </label>
                <select value={studentCampusFilter} onChange={(event) => setStudentCampusFilter(event.target.value)}>
                  <option value="ALL">All campuses</option>
                  <option value="UR">UR</option>
                  <option value="RP">RP</option>
                </select>
              </div>
            </div>

            <div className="student-editor-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Selected student</p>
                  <h3>{selectedStudent ? selectedStudent.name : 'No student selected'}</h3>
                </div>
                <div className="student-picker">
                  <label htmlFor="student-selector">Select student</label>
                  <select
                    id="student-selector"
                    value={selectedStudent?.id || ''}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                  >
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.regNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedStudent ? (
                <>
                  <div className="student-editor-grid">
                    <label>
                      <span>Name</span>
                      <input
                        type="text"
                        value={selectedStudentDraft.name}
                        disabled={isSaving || !selectedStudent.allowAdminUpdates}
                        onChange={(event) =>
                          setSelectedStudentDraft((currentDraft) => ({
                            ...currentDraft,
                            name: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Email</span>
                      <input
                        type="email"
                        value={selectedStudentDraft.email}
                        disabled={isSaving || !selectedStudent.allowAdminUpdates}
                        onChange={(event) =>
                          setSelectedStudentDraft((currentDraft) => ({
                            ...currentDraft,
                            email: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Registration number</span>
                      <input
                        type="text"
                        value={selectedStudentDraft.regNumber}
                        disabled={isSaving || !selectedStudent.allowAdminUpdates}
                        onChange={(event) =>
                          setSelectedStudentDraft((currentDraft) => ({
                            ...currentDraft,
                            regNumber: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Campus</span>
                      <select
                        value={selectedStudentDraft.campus}
                        disabled={isSaving || !selectedStudent.allowAdminUpdates}
                        onChange={(event) =>
                          setSelectedStudentDraft((currentDraft) => ({
                            ...currentDraft,
                            campus: event.target.value,
                          }))
                        }
                      >
                        <option value="UR">UR</option>
                        <option value="RP">RP</option>
                      </select>
                    </label>
                    <label>
                      <span>Gender</span>
                      <select
                        value={selectedStudentDraft.gender}
                        disabled={isSaving || !selectedStudent.allowAdminUpdates}
                        onChange={(event) =>
                          setSelectedStudentDraft((currentDraft) => ({
                            ...currentDraft,
                            gender: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map((genderOption) => (
                          <option key={genderOption.value} value={genderOption.value}>
                            {genderOption.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="permission-badge-card">
                      <span>Admin update access</span>
                      <strong>
                        {ADMIN_UPDATE_ACCESS_LABELS[String(Boolean(selectedStudent.allowAdminUpdates))]}
                      </strong>
                    </div>
                  </div>

                  {!selectedStudent.allowAdminUpdates && (
                    <div className="empty-state student-lock-note">
                      This student has not granted admin update access yet. Ask them to enable it from their portal
                      before editing the account or resetting the password.
                    </div>
                  )}

                  <div className="student-editor-actions">
                    <button
                      type="button"
                      className="action-button"
                      disabled={isSaving || !selectedStudent.allowAdminUpdates}
                      onClick={handleSelectedStudentSave}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className="delete-button"
                      disabled={isSaving}
                      onClick={handleSelectedStudentDelete}
                    >
                      Delete Account
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state">Choose a student from the list below to view and manage their account.</div>
              )}
            </div>

            {filteredStudents.length === 0 ? (
              <div className="empty-state">No registered students match the current search.</div>
            ) : (
              <div className="student-directory-list">
                {filteredStudents.map((student) => {
                  const studentProfileImage = buildProfileImageSrc(
                    student.profileImageUrl,
                    student.profileImageUpdatedAt
                  );
                  const latestStudentApplication = getLatestApplicationForStudent(student);
                  const latestPaymentStatus = latestStudentApplication?.paymentStatus ?? 'pending';

                  return (
                    <div key={student.id} className="student-row">
                      <div className="student-main">
                        <div className="applicant-profile">
                          <div className="applicant-avatar">
                            {studentProfileImage ? (
                              <img src={studentProfileImage} alt={`${student.name} profile`} />
                            ) : (
                              student.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <strong>{student.name}</strong>
                            <span>{student.email}</span>
                          </div>
                        </div>

                        <div className="student-meta">
                          <span>{student.regNumber}</span>
                          <span>{student.campus}</span>
                          <span>Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                          <span>
                            Latest application:{' '}
                            {latestStudentApplication
                              ? APPLICATION_STATUS_LABELS[latestStudentApplication.status]
                              : 'No application yet'}
                          </span>
                          <span>
                            Payment:{' '}
                            {latestStudentApplication
                              ? PAYMENT_STATUS_LABELS[latestPaymentStatus]
                              : 'No payment submitted'}
                          </span>
                          <span>Gender: {GENDER_OPTIONS.find((item) => item.value === student.gender)?.label || student.gender || 'Not set'}</span>
                          <span>
                            Admin update access:{' '}
                            {ADMIN_UPDATE_ACCESS_LABELS[String(Boolean(student.allowAdminUpdates))]}
                          </span>
                        </div>
                      </div>

                      <div className="student-controls">
                        <button
                          type="button"
                          className="action-button"
                          disabled={isSaving}
                          onClick={() => setSelectedStudentId(student.id)}
                        >
                          Select
                        </button>
                        <label className="password-reset-group">
                          <span>
                            <FaKey /> New Password
                          </span>
                          <input
                            type="password"
                            value={passwordDrafts[student.id] ?? ''}
                            disabled={isSaving}
                            placeholder="Set a strong password"
                            onChange={(event) =>
                              setPasswordDrafts((currentDrafts) => ({
                                ...currentDrafts,
                                [student.id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="action-button"
                          disabled={isSaving}
                          onClick={() => handlePasswordReset(student.id)}
                        >
                          Reset Password
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  );
};

export default AdminPortal;
