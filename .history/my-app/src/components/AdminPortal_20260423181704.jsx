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
import { PORTAL_IMAGES } from '../data/siteImages';
import { getDisplayName, getInitials, getLocalTimeLabel, getTimeGreeting } from '../utils/display';
import CampusCarousel from './CampusCarousel';
import HighlightText from './HighlightText';
import DashboardSidebar from './DashboardSidebar';
import Settings from './Settings';
import './AdminPortal.scss';

const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const matchesCampusFilter = (value, campusFilter) => campusFilter === 'ALL' || String(value ?? '').toUpperCase() === campusFilter;

const matchesQuery = (values, query) => {
  if (!query) {
    return true;
  }

  return values.some((value) => normalizeText(value).includes(query));
};

const AdminPortal = ({
  onLogout,
  adminName,
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
  onUpdateAdminProfile,
  adminProfile,
  session,
}) => {
  const { theme, changeTheme } = useTheme();
  const [activeView, setActiveView] = useState('overview');
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [studentSearch, setStudentSearch] = useState('');
  const [flash, setFlash] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const displayedAdminName = getDisplayName(
    [session?.name, adminName, session?.email?.split('@')[0], 'Housing Administrator'],
    'Housing Administrator'
  );
  const adminInitials = getInitials(displayedAdminName, 'AD');
  const adminAvatarSrc = buildProfileImageSrc(
    session?.profileImageUrl || adminProfile?.profileImageUrl,
    session?.profileImageUpdatedAt || adminProfile?.profileImageUpdatedAt
  );
  const timeGreeting = getTimeGreeting();
  const currentTimeLabel = getLocalTimeLabel();
  const searchQuery = studentSearch.trim().toLowerCase();
  const selectedCampusLabel =
    campusFilter === 'UR' ? 'University of Rwanda' : campusFilter === 'RP' ? 'Rwanda Polytechnic' : 'All campuses';

  const roomDrafts = useMemo(() =>
    roomInventory.reduce((drafts, room) => {
      drafts[room.id] = {
        total: room.total,
        status: room.status,
      };
      return drafts;
    }, {}),
    [roomInventory]
  );

  const assignmentDrafts = useMemo(() =>
    applications.reduce((drafts, application) => {
      drafts[application.id] = application.assignedRoom ?? '';
      return drafts;
    }, {}),
    [applications]
  );

  const paymentNotesDrafts = useMemo(() =>
    applications.reduce((drafts, application) => {
      drafts[application.id] = application.paymentVerificationNotes ?? '';
      return drafts;
    }, {}),
    [applications]
  );

  useEffect(() => {
    if (registeredUsers.length === 0) {
      setSelectedStudentId('');
      return;
    }

    // Only set default if no student is currently selected
    if (!selectedStudentId) {
      setSelectedStudentId(registeredUsers[0].id);
    }
  }, [registeredUsers]);

  useEffect(() => {
    if (!flash) {
      return undefined;
    }

    const timer = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  const campusScopedRooms = useMemo(
    () => roomInventory.filter((room) => matchesCampusFilter(room.campus, campusFilter)),
    [roomInventory, campusFilter]
  );

  const campusScopedApplications = useMemo(
    () => applications.filter((application) => matchesCampusFilter(application.campus, campusFilter)),
    [applications, campusFilter]
  );

  const campusScopedStudents = useMemo(
    () => registeredUsers.filter((user) => matchesCampusFilter(user.campus, campusFilter)),
    [registeredUsers, campusFilter]
  );

  const campusScopedPasswordResetRequests = useMemo(
    () => passwordResetRequests.filter((request) => matchesCampusFilter(request.campus, campusFilter)),
    [passwordResetRequests, campusFilter]
  );

  const filteredRoomInventory = useMemo(
    () =>
      campusScopedRooms.filter((room) =>
        matchesQuery([room.campus, room.label, room.typeKey, room.status, room.total], searchQuery)
      ),
    [campusScopedRooms, searchQuery]
  );

  const filteredApplications = useMemo(
    () =>
      campusScopedApplications
        .filter((application) => statusFilter === 'ALL' || application.status === statusFilter)
        .filter((application) =>
          matchesQuery(
            [
              application.name,
              application.email,
              application.regNumber,
              application.campus,
              application.studyCampus,
              application.roomType,
              application.status,
              application.paymentStatus,
              application.paymentMethod,
              application.paymentReference,
              application.assignedRoom,
              application.phone,
              application.paymentVerificationNotes,
              application.amountPaid,
              application.expectedRentAmount,
            ],
            searchQuery
          )
        ),
    [campusScopedApplications, statusFilter, searchQuery]
  );

  const filteredStudents = useMemo(
    () =>
      campusScopedStudents.filter((user) =>
        matchesQuery(
          [user.name, user.email, user.regNumber, user.campus, user.gender, user.phone, user.allowAdminUpdates ? 'allowed' : 'not allowed'],
          searchQuery
        )
      ),
    [campusScopedStudents, searchQuery]
  );

  const filteredPasswordResetRequests = useMemo(
    () =>
      campusScopedPasswordResetRequests.filter((request) =>
        matchesQuery(
          [request.name, request.email, request.regNumber, request.campus, request.gender, request.reason, request.status, request.resetCode],
          searchQuery
        )
      ),
    [campusScopedPasswordResetRequests, searchQuery]
  );

  const totalRooms = campusScopedRooms.reduce((sum, room) => sum + room.total, 0);
  const approvedApplications = campusScopedApplications.filter((application) => application.status === 'approved');
  const verifiedPayments = campusScopedApplications.filter((application) => application.paymentStatus === 'verified');
  const pendingPasswordResetRequests = campusScopedPasswordResetRequests.filter(
    (request) => request.status === 'pending'
  ).length;
  const approvedAllocations = useMemo(
    () => sortApplicationsByDate(filteredApplications.filter((application) => application.status === 'approved')),
    [filteredApplications]
  );
  const pendingApplications = campusScopedApplications.filter((application) => application.status === 'pending').length;
  const pendingPaymentReviews = campusScopedApplications.filter(
    (application) => (application.paymentStatus ?? 'pending') === 'pending'
  ).length;
  const occupancyRate = totalRooms > 0 ? Math.round((approvedApplications.length / totalRooms) * 100) : 0;
  const openRoomGroups = campusScopedRooms.filter((room) => room.status === 'open').length;

  // Sidebar stats
  const sidebarStats = {
    totalStudents: campusScopedStudents.length,
    totalApplications: campusScopedApplications.length,
    pendingApplications,
    pendingPaymentReviews,
    approvedApplications: approvedApplications.length,
    totalRooms,
    waitlistedApplications: campusScopedApplications.filter((app) => app.status === 'waitlisted').length,
    pendingPasswordResets: pendingPasswordResetRequests,
  };

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

  const visibleCampusSummaries = campusFilter === 'ALL'
    ? campusSummaries
    : campusSummaries.filter((summary) => summary.campus === campusFilter);

  const getLatestApplicationForStudent = React.useCallback((user) => {
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
  }, [applications]);

  const adminSearchResults = useMemo(() => {
    if (!searchQuery) {
      return [];
    }

    const index = [
      {
        id: 'overview',
        title: 'Overview',
        description: `${campusScopedStudents.length} registered students, ${campusScopedApplications.length} applications`,
        detail: `${pendingApplications} pending applications`,
        keywords: ['overview', 'summary', 'students', 'applications', 'payments', 'rooms'].join(' '),
        onClick: () => setActiveView('overview'),
      },
      ...visibleCampusSummaries.map((summary) => ({
        id: `campus-${summary.campus}`,
        title: `${summary.campus} campus`,
        description: `${summary.totalRooms} total rooms, ${summary.availableRooms} available`,
        detail: `${summary.waitingApplications} waiting application(s)`,
        keywords: [summary.campus, 'campus', 'rooms', 'applications', 'payments'].join(' '),
        onClick: () => setActiveView('overview'),
      })),
      {
        id: 'payment-review',
        title: 'Payment Review',
        description: `${pendingPaymentReviews} payment(s) waiting for review`,
        detail: `${verifiedPayments.length} verified payment(s)`,
        keywords: ['payment', 'verify', 'review', 'rent', 'hostel', 'payment review'].join(' '),
        onClick: () => setActiveView('payment-review'),
      },
      {
        id: 'password-reset',
        title: 'Password Reset',
        description: `${pendingPasswordResetRequests} reset request(s)`,
        detail: 'Approve or reject reset codes',
        keywords: ['password', 'reset', 'code', 'approve', 'request'].join(' '),
        onClick: () => setActiveView('password-reset'),
      },
      {
        id: 'students',
        title: 'Student Directory',
        description: `${filteredStudents.length} student account(s) visible`,
        detail: 'View, edit, or delete student records',
        keywords: filteredStudents
          .flatMap((student) => [student.name, student.email, student.regNumber, student.campus, student.gender])
          .filter(Boolean)
          .join(' '),
        onClick: () => setActiveView('students'),
      },
      {
        id: 'applications',
        title: 'Applications',
        description: `${filteredApplications.length} application(s) matching filters`,
        detail: 'Open the application workflow',
        keywords: ['applications', 'students', 'payments', 'rooms', 'status', 'verify'].join(' '),
        onClick: () => setActiveView('applications'),
      },
      {
        id: 'rooms',
        title: 'Room Inventory',
        description: `${filteredRoomInventory.length} room(s) matching filters`,
        detail: 'Open the room management panel',
        keywords: ['rooms', 'room', 'inventory', 'capacity', 'hostel'].join(' '),
        onClick: () => setActiveView('rooms'),
      },
      {
        id: 'settings',
        title: 'Settings',
        description: 'Update appearance and account preferences',
        detail: 'Open admin settings',
        keywords: ['settings', 'theme', 'appearance', 'preferences', 'account'].join(' '),
        onClick: () => setActiveView('settings'),
      },
      ...filteredStudents.map((student) => {
        const latestStudentApplication = getLatestApplicationForStudent(student);
        const latestPaymentStatus = latestStudentApplication?.paymentStatus ?? 'pending';

        return {
          id: `student-${student.id}`,
          title: student.name,
          description: `${student.email} | ${student.regNumber} | ${student.campus}`,
          detail: `Latest application: ${latestStudentApplication ? APPLICATION_STATUS_LABELS[latestStudentApplication.status] : 'No application yet'}`,
          keywords: [
            student.name,
            student.email,
            student.regNumber,
            student.campus,
            student.gender,
            latestPaymentStatus,
            'student',
            'directory',
          ]
            .filter(Boolean)
            .join(' '),
          onClick: () => {
            setActiveView('students');
            setSelectedStudentId(student.id);
          },
        };
      }),
      ...filteredApplications.slice(0, 12).map((application) => ({
        id: `application-${application.id}`,
        title: application.name,
        description: `${application.regNumber} | ${application.campus} | ${ROOM_TYPE_LABELS[application.roomType] || application.roomType}`,
        detail: `${APPLICATION_STATUS_LABELS[application.status]} | ${PAYMENT_STATUS_LABELS[application.paymentStatus ?? 'pending']}`,
        keywords: [
          application.email,
          application.phone,
          application.studyCampus,
          application.paymentReference,
          application.assignedRoom,
          application.paymentMethod,
          application.paymentVerificationNotes,
          application.campus,
          application.roomType,
          application.status,
        ]
          .filter(Boolean)
          .join(' '),
        onClick: () => setActiveView('applications'),
      })),
      ...filteredRoomInventory.slice(0, 12).map((room) => ({
        id: `room-${room.id}`,
        title: `${room.campus} ${room.label}`,
        description: `${room.total} room(s) | ${room.status}`,
        detail: `${getOccupiedCountForRoom(room)} occupied`,
        keywords: [room.campus, room.label, room.typeKey, room.status, room.total].join(' '),
        onClick: () => setActiveView('rooms'),
      })),
      ...filteredPasswordResetRequests.slice(0, 12).map((request) => ({
        id: `reset-${request.id}`,
        title: request.name,
        description: `${request.regNumber} | ${request.campus}`,
        detail: PASSWORD_RESET_REQUEST_STATUS_LABELS[request.status] || 'Pending approval',
        keywords: [request.email, request.gender, request.reason, request.status, request.resetCode].filter(Boolean).join(' '),
        onClick: () => setActiveView('password-reset'),
      })),
    ];

    return index.filter((item) =>
      normalizeText(`${item.title} ${item.description} ${item.detail} ${item.keywords}`).includes(searchQuery)
    );
  }, [
    searchQuery,
    campusScopedStudents.length,
    campusScopedApplications.length,
    pendingApplications,
    pendingPaymentReviews,
    verifiedPayments.length,
    pendingPasswordResetRequests,
    visibleCampusSummaries,
    filteredStudents,
    filteredApplications,
    filteredRoomInventory,
    filteredPasswordResetRequests,
    getLatestApplicationForStudent,
  ]);

  const selectedStudent = useMemo(
    () => filteredStudents.find((student) => student.id === selectedStudentId) ?? filteredStudents[0] ?? null,
    [filteredStudents, selectedStudentId]
  );

  const selectedStudentDraft = useMemo(() => {
    if (!selectedStudent) {
      return {
        name: '',
        email: '',
        regNumber: '',
        campus: 'UR',
        gender: '',
        allowAdminUpdates: false,
      };
    }

    return {
      name: selectedStudent.name ?? '',
      email: selectedStudent.email ?? '',
      regNumber: selectedStudent.regNumber ?? '',
      campus: selectedStudent.campus ?? 'UR',
      gender: selectedStudent.gender ?? '',
      allowAdminUpdates: Boolean(selectedStudent.allowAdminUpdates),
    };
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
      setSelectedStudentId((currentSelectedStudentId) =>
        currentSelectedStudentId === selectedStudent.id ? '' : currentSelectedStudentId
      );
    }
  };

  const handleRowDelete = async (student) => {
    if (!student) {
      return;
    }

    const confirmed = window.confirm(`Delete ${student.name}'s account and related applications?`);
    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    const result = await onDeleteStudent(student.id);
    setIsSaving(false);
    showFlash(result);

    if (result.success) {
      setSelectedStudentId((currentSelectedStudentId) =>
        currentSelectedStudentId === student.id ? '' : currentSelectedStudentId
      );
    }
  };

  return (
    <div className={`admin-portal ${theme}`}>
      <header className="admin-header">
        <div className="admin-toolbar">
          <label className="admin-search">
            <FaSearch />
            <input
              type="search"
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search students, rooms, payments..."
              aria-label="Search students, rooms, payments, and more"
            />
          </label>

          <div className="admin-toolbar-actions">
            <label className="admin-campus-filter">
              <span>Campus</span>
              <select value={campusFilter} onChange={(event) => setCampusFilter(event.target.value)}>
                <option value="ALL">All campuses</option>
                <option value="UR">UR</option>
                <option value="RP">RP</option>
              </select>
            </label>

            <button
              className="theme-toggle"
              onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>

            <div className="header-user-block">
              <button
                type="button"
                className="user-chip"
                aria-label={`${displayedAdminName} profile settings`}
                onClick={() => {
                  setActiveView('settings');
                }}
              >
                {adminAvatarSrc ? <img src={adminAvatarSrc} alt="" /> : <span>{adminInitials}</span>}
              </button>
              <span className="header-user-subtitle">Signed in as {displayedAdminName}</span>
            </div>
          </div>
        </div>

        <div className="admin-hero">
          <div>
            <p className="eyebrow">Admin Monitor</p>
            <h1>{timeGreeting}, {displayedAdminName}</h1>
            <p className="admin-copy">
              Monitor registrations, verify hostel rent payments, approve qualified students, and support account
              recovery from one place.
            </p>
            <p className="time-note">
              Local time: {currentTimeLabel} | Campus scope: {selectedCampusLabel}
            </p>
          </div>
        </div>
      </header>

      <div className="admin-layout-with-sidebar">
        <DashboardSidebar 
          activeView={activeView} 
          onViewChange={setActiveView} 
          stats={sidebarStats}
          userType="admin"
          searchQuery={studentSearch}
          onLogout={onLogout}
        />

        <div className="admin-main-content">
        {studentSearch.trim() && (
          <section className="admin-search-results-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Search results</p>
                <h2>
                  Matches for "{studentSearch.trim()}" in {selectedCampusLabel}
                </h2>
              </div>
              <span className="search-results-count">{adminSearchResults.length} result(s)</span>
            </div>

            {adminSearchResults.length === 0 ? (
              <div className="empty-state">
                No admin matches found. Try a student's name, email, room, payment, campus, or reset.
              </div>
            ) : (
              <div className="search-results-grid">
                {adminSearchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="search-result-card"
                    onClick={result.onClick}
                  >
                    <span className="search-result-title">
                      <HighlightText text={result.title} query={studentSearch} />
                    </span>
                    <span className="search-result-description">
                      <HighlightText text={result.description} query={studentSearch} />
                    </span>
                    <span className="search-result-detail">
                      <HighlightText text={result.detail} query={studentSearch} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )} 
        {activeView === 'approved' && (
          <section className="admin-card approved-list-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Approved allocations</p>
                <h2>Rooms that are already allocated</h2>
              </div>
              <FaCheckCircle className="section-icon" />
            </div>

            {approvedAllocations.length === 0 ? (
              <div className="empty-state">No approved room allocations are available yet.</div>
            ) : (
              <div className="application-list approved-allocation-list">
                {approvedAllocations.map((application) => {
                  const matchedStudent = getStudentForApplication(application);
                  const studentProfileImage = buildProfileImageSrc(
                    matchedStudent?.profileImageUrl,
                    matchedStudent?.profileImageUpdatedAt
                  );

                  return (
                    <article key={application.id} className="application-row approved-allocation-row">
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
                            <span className={`payment-pill ${application.paymentStatus ?? 'pending'}`}>
                              {PAYMENT_STATUS_LABELS[application.paymentStatus ?? 'pending']}
                            </span>
                          </div>
                        </div>

                        <div className="application-meta">
                          <span>{application.regNumber}</span>
                          <span>{application.campus}</span>
                          <span>{ROOM_TYPE_LABELS[application.roomType] || application.roomType}</span>
                          <span>Room: {application.assignedRoom || 'Not assigned yet'}</span>
                          <span>
                            Verified:{' '}
                            {application.paymentVerifiedAt
                              ? new Date(application.paymentVerifiedAt).toLocaleDateString()
                              : 'Not set'}
                          </span>
                        </div>

                        <p>
                          {application.paymentVerificationNotes ||
                            'Approved for allocation and ready for room placement.'}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
        {activeView === 'overview' && (
          <>
      {pendingPasswordResetRequests > 0 && (
        <section className="admin-card admin-notice-card">
          <div>
            <p className="eyebrow">Notification</p>
            <h2>
              {pendingPasswordResetRequests} password reset request{pendingPasswordResetRequests > 1 ? 's' : ''} waiting for approval
            </h2>
            <p>
              Students have already submitted their reset requests. Review them in the password reset panel so you
              can approve and issue a one-time code.
            </p>
          </div>
          <button type="button" className="action-button" onClick={() => setActiveView('password-reset')}>
            Review Requests
          </button>
        </section>
      )}

      <section className="admin-campus-strip" aria-label="Campus room summary">
        {visibleCampusSummaries.map((summary) => (
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

            <div className="campus-room-breakdown">
              <h4>Room Availability by Type</h4>
              {roomInventory
                .filter((room) => room.campus === summary.campus)
                .map((room) => {
                  const occupied = getOccupiedCountForRoom(room);
                  const available = Math.max(room.total - occupied, 0);
                  return (
                    <div key={room.id} className="room-breakdown-item">
                      <span className="room-type-name">{room.label}</span>
                      <span className={`room-availability-count ${available > 0 ? 'available' : 'full'}`}>
                        {available}/{room.total} available
                      </span>
                    </div>
                  );
                })}
            </div>

            <p>
              {summary.waitingApplications} waiting application(s) and {summary.verifiedPayments} verified payment(s)
              are linked to this campus.
            </p>
          </article>
        ))}
      </section>

      <section className="admin-image-gallery" aria-label="Project images">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Project images</p>
            <h2>Local image set used across the portal</h2>
          </div>
          <FaChartBar className="section-icon" />
        </div>

        <CampusCarousel
          slides={PORTAL_IMAGES}
          variant="compact"
          className="admin-campus-carousel"
        />
      </section>
          </>
        )}

      <div className="admin-content">
        {flash && <div className={`admin-flash ${flash.type}`}>{flash.message}</div>}

        {(activeView === 'overview' || activeView === '') && (
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
        )}

        {activeView === 'payment-review' && (
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
        )}

        {activeView === 'password-reset' && (
        <section className="admin-card password-reset-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Password reset requests</p>
              <h2>One-time code approvals</h2>
            </div>
            <FaKey className="section-icon" />
          </div>

          {filteredPasswordResetRequests.length === 0 ? (
            <div className="empty-state">No password reset requests have been submitted yet.</div>
          ) : (
            <div className="password-reset-list">
              {filteredPasswordResetRequests.map((request) => {
                const statusLabel = PASSWORD_RESET_REQUEST_STATUS_LABELS[request.status] || 'Pending approval';

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
        )}

        {activeView === 'overview' && (
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
        )}

        {(activeView === 'rooms' || activeView === 'applications' || activeView === '') && (
        <section className="admin-layout">
          {(activeView === 'rooms' || activeView === '') && (
          <article className="admin-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Manage rooms</p>
                <h2>Room inventory</h2>
              </div>
            </div>

            <div className="room-list">
              {filteredRoomInventory.length === 0 ? (
                <div className="empty-state">No rooms match the current campus and search filters.</div>
              ) : (
                filteredRoomInventory.map((room) => {
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
                })
              )}
            </div>
          </article>
          )}

          {(activeView === 'applications' || activeView === '') && (
          <article className="admin-card">
            <div className="section-heading applicants-heading">
              <div>
                <p className="eyebrow">Manage applicants</p>
                <h2>Room applications</h2>
              </div>

              <div className="applicant-filters">
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

                        <div className="room-availability-notice">
                          <h4>Room Availability for {application.campus} Campus</h4>
                          <div className="campus-room-summary">
                            {roomInventory
                              .filter((room) => room.campus === application.campus)
                              .map((room) => {
                                const occupied = getOccupiedCountForRoom(room);
                                const available = Math.max(room.total - occupied, 0);
                                return (
                                  <div key={room.id} className="room-type-summary">
                                    <span className="room-type">{room.label}</span>
                                    <span className={`availability ${available > 0 ? 'available' : 'full'}`}>
                                      {available} available ({occupied} occupied / {room.total} total)
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                          <div className="campus-total">
                            <strong>
                              Total available rooms in {application.campus}:{' '}
                              {roomInventory
                                .filter((room) => room.campus === application.campus)
                                .reduce((total, room) => {
                                  const occupied = getOccupiedCountForRoom(room);
                                  const available = Math.max(room.total - occupied, 0);
                                  return total + available;
                                }, 0)}
                            </strong>
                          </div>
                        </div>
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
          )}
        </section>
        )}

        {activeView === 'students' && (
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
                    placeholder="Search name, email, reg number, or campus"
                  />
                </label>
                <span className="student-campus-note">Scope: {selectedCampusLabel}</span>
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
                      <label className="student-permission-toggle">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedStudentDraft.allowAdminUpdates)}
                          onChange={(event) =>
                            setSelectedStudentDraft((currentDraft) => ({
                              ...currentDraft,
                              allowAdminUpdates: event.target.checked,
                            }))
                          }
                        />
                        <span>Allow admin updates</span>
                      </label>
                    </div>
                  </div>

                  <div className="empty-state student-lock-note">
                    Admins can edit the selected student directly from this panel. The access flag is still shown so you
                    can keep track of whether the student had approved admin updates.
                  </div>

                  <div className="student-editor-actions">
                    <button
                      type="button"
                      className="action-button"
                      disabled={isSaving}
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

            <div className="student-directory-summary">
              <div>
                <p className="eyebrow">Registered accounts</p>
                <strong>{filteredStudents.length} account(s) visible</strong>
              </div>
              <span>
                Select any account to review details, reset a password, or delete the student and their related
                applications.
              </span>
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
                          Select / View
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
                        <button
                          type="button"
                          className="delete-button student-delete-button"
                          disabled={isSaving}
                          onClick={() => handleRowDelete(student)}
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>
        )}

        {activeView === 'settings' && (
          <Settings
            user={adminProfile || { name: displayedAdminName, email: session?.email || '', phone: session?.phone || '', gender: session?.gender || '', allowAdminUpdates: false }}
            userType="admin"
            onUpdateProfile={onUpdateAdminProfile}
          />
        )}
      </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
