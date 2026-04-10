import React, { useEffect, useMemo, useState } from 'react';
import { FaGraduationCap, FaUserShield } from 'react-icons/fa';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPortal from './components/AdminPortal';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import {
  ADMIN_ACCOUNT,
  STORAGE_KEYS,
  buildProfileImageSrc,
  createId,
  getUserAccountKey,
  getUserRecencyScore,
  readStoredValue,
  STUDY_CAMPUSES,
  sortApplicationsByDate,
} from './data/portalData';
import {
  createApplication,
  createUser,
  ensureRoomInventorySeeded,
  subscribeToApplications,
  subscribeToRooms,
  subscribeToUsers,
  updateApplication,
  updateRoom,
  updateUserProfileImage,
  updateUserProfileImageForUsers,
  uploadProfileImage,
} from './services/portalRepository';
import './App.scss';

const APPLICATION_DEADLINE = new Date('2026-05-15T23:59:59');
const PROFILE_IMAGE_UPLOAD_TIMEOUT_MS = 90000;

const withTimeout = (promise, timeoutMessage, timeoutMs = PROFILE_IMAGE_UPLOAD_TIMEOUT_MS) =>
  new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });

const getLatestApplicationForStudent = (applications, regNumber) =>
  sortApplicationsByDate(applications.filter((application) => application.regNumber === regNumber))[0] ?? null;

const getPreferredUserRecord = (matchingUsers) =>
  [...matchingUsers].sort((left, right) => getUserRecencyScore(right) - getUserRecencyScore(left))[0] ?? null;

const getApprovedCountForRoom = (applications, room) =>
  applications.filter(
    (application) =>
      application.status === 'approved' &&
      application.campus === room.campus &&
      application.roomType === room.typeKey
  ).length;

const getCampusRoomStats = (applications, rooms, campus) => {
  const campusRooms = rooms.filter((room) => room.campus === campus);
  const totalRooms = campusRooms.reduce((sum, room) => sum + room.total, 0);
  const occupiedRooms = campusRooms.reduce((sum, room) => sum + getApprovedCountForRoom(applications, room), 0);

  return {
    campusRooms,
    totalRooms,
    occupiedRooms,
    remainingRooms: Math.max(totalRooms - occupiedRooms, 0),
  };
};

function AppContent() {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [roomInventory, setRoomInventory] = useState([]);
  const [session, setSession] = useState(() => readStoredValue(STORAGE_KEYS.session, null));
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
      return;
    }

    localStorage.removeItem(STORAGE_KEYS.session);
  }, [session]);

  useEffect(() => {
    let isMounted = true;
    const loaded = {
      applications: false,
      rooms: false,
      users: false,
    };

    const markLoaded = (key) => {
      loaded[key] = true;
      if (isMounted && Object.values(loaded).every(Boolean)) {
        setIsSyncing(false);
      }
    };

    setIsSyncing(true);
    setSyncError('');

    ensureRoomInventorySeeded().catch((error) => {
      console.error('Failed to seed rooms:', error);
      if (isMounted) {
        setSyncError('room setup failed. Check your Firestore permissions and config.');
      }
    });

    const unsubscribeUsers = subscribeToUsers(
      (nextUsers) => {
        if (!isMounted) {
          return;
        }
        setUsers(nextUsers);
        markLoaded('users');
      },
      (error) => {
        console.error('Users subscription failed:', error);
        if (isMounted) {
          setSyncError('Could not load student accounts from  database.');
          markLoaded('users');
        }
      }
    );

    const unsubscribeApplications = subscribeToApplications(
      (nextApplications) => {
        if (!isMounted) {
          return;
        }
        setApplications(nextApplications);
        markLoaded('applications');
      },
      (error) => {
        console.error('Applications subscription failed:', error);
        if (isMounted) {
          setSyncError('Could not load applications from database.');
          markLoaded('applications');
        }
      }
    );

    const unsubscribeRooms = subscribeToRooms(
      (nextRooms) => {
        if (!isMounted) {
          return;
        }
        setRoomInventory(nextRooms);
        markLoaded('rooms');
      },
      (error) => {
        console.error('Rooms subscription failed:', error);
        if (isMounted) {
          setSyncError('Could not load room inventory from Database.');
          markLoaded('rooms');
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribeUsers();
      unsubscribeApplications();
      unsubscribeRooms();
    };
  }, []);

  const activeStudent = useMemo(() => {
    if (session?.role !== 'student') {
      return null;
    }

    const sessionUser = users.find((user) => user.id === session.userId) ?? null;
    const sessionAccountKey = session.accountKey || getUserAccountKey(sessionUser);

    if (!sessionAccountKey) {
      return sessionUser;
    }

    const matchingUsers = users.filter((user) => getUserAccountKey(user) === sessionAccountKey);
    return getPreferredUserRecord(matchingUsers) ?? sessionUser;
  }, [session, users]);

  useEffect(() => {
    if (session?.role === 'student' && !isSyncing && !activeStudent) {
      setSession(null);
    }
  }, [activeStudent, isSyncing, session]);

  useEffect(() => {
    if (session?.role !== 'student' || !activeStudent) {
      return;
    }

    const nextAccountKey = getUserAccountKey(activeStudent);
    if (session.userId === activeStudent.id && session.accountKey === nextAccountKey) {
      return;
    }

    setSession((currentSession) => {
      if (currentSession?.role !== 'student') {
        return currentSession;
      }

      return {
        ...currentSession,
        userId: activeStudent.id,
        accountKey: nextAccountKey,
      };
    });
  }, [activeStudent, session]);

  const latestStudentApplication = activeStudent
    ? getLatestApplicationForStudent(applications, activeStudent.regNumber)
    : null;
  const studentApplications = activeStudent
    ? sortApplicationsByDate(
        applications.filter((application) => application.regNumber === activeStudent.regNumber)
      )
    : [];

  const { campusRooms, totalRooms, occupiedRooms, remainingRooms } = activeStudent
    ? getCampusRoomStats(applications, roomInventory, activeStudent.campus)
    : { campusRooms: [], totalRooms: 0, occupiedRooms: 0, remainingRooms: 0 };

  const pastDeadline = new Date() > APPLICATION_DEADLINE;
  const roomClosed =
    pastDeadline ||
    remainingRooms <= 0 ||
    (campusRooms.length > 0 && campusRooms.every((room) => room.status === 'closed'));

  const handleStudentLogin = async (credentials) => {
    if (isSyncing) {
      return { success: false, message: 'Database data is still loading. Please wait a moment and try again.' };
    }

    const matchedUser = users.find(
      (user) =>
        credentials.email.toLowerCase() === user.email.toLowerCase() &&
        credentials.password === user.password &&
        credentials.regNumber.toLowerCase() === user.regNumber.toLowerCase() &&
        credentials.campus === user.campus
    );

    if (!matchedUser) {
      return { success: false, message: 'Invalid student credentials. Please check your details.' };
    }

    setSession({
      role: 'student',
      userId: matchedUser.id,
      accountKey: getUserAccountKey(matchedUser),
    });

    return { success: true };
  };

  const handleAdminLogin = async (credentials) => {
    const validAdmin =
      credentials.email.toLowerCase() === ADMIN_ACCOUNT.email.toLowerCase() &&
      credentials.password === ADMIN_ACCOUNT.password;

    if (!validAdmin) {
      return { success: false, message: 'Invalid admin credentials. Use the configured admin account.' };
    }

    setSession({
      role: 'admin',
      email: ADMIN_ACCOUNT.email,
    });

    return { success: true };
  };

  const handleRegister = async (user) => {
    const duplicateEmail = users.some(
      (existingUser) => existingUser.email.toLowerCase() === user.email.toLowerCase()
    );
    if (duplicateEmail) {
      return { success: false, message: 'That email is already registered. Please log in instead.' };
    }

    const duplicateRegNumber = users.some(
      (existingUser) => existingUser.regNumber.toLowerCase() === user.regNumber.toLowerCase()
    );
    if (duplicateRegNumber) {
      return {
        success: false,
        message: 'That registration number already exists. Please use your current account.',
      };
    }

    try {
      await createUser({
        ...user,
        localKey: createId('user'),
      });
      return { success: true, message: 'Account created successfully in Dataebase. You can now log in.' };
    } catch (error) {
      console.error('Failed to register user:', error);
      return { success: false, message: 'Failed to create the Database account. Check your Firestore rules.' };
    }
  };

  const handleRoomApplication = async (data) => {
    if (!activeStudent) {
      return { success: false, message: 'Please log in as a student before applying.' };
    }

    const validStudyCampuses = STUDY_CAMPUSES[activeStudent.campus] ?? [];
    if (!validStudyCampuses.includes(data.studyCampus)) {
      return { success: false, message: 'Please choose your study campus before submitting.' };
    }

    const latestApplication = getLatestApplicationForStudent(applications, activeStudent.regNumber);
    if (latestApplication && latestApplication.status !== 'rejected') {
      return {
        success: false,
        message: 'You already have an active application. Admin review must finish before another one.',
      };
    }

    if (pastDeadline) {
      return {
        success: false,
        message: `Applications closed on ${APPLICATION_DEADLINE.toLocaleDateString()}.`,
      };
    }

    const requestedRoom = roomInventory.find(
      (room) => room.campus === activeStudent.campus && room.typeKey === data.roomType
    );

    if (!requestedRoom || requestedRoom.status === 'closed') {
      return {
        success: false,
        message: 'That room category is currently closed. Choose another room type later.',
      };
    }

    const occupiedForRequestedRoom = getApprovedCountForRoom(applications, requestedRoom);
    if (occupiedForRequestedRoom >= requestedRoom.total) {
      return {
        success: false,
        message: 'That room category is already full. Please choose another available option.',
      };
    }

    try {
      await createApplication({
        studentId: activeStudent.id,
        name: activeStudent.name,
        email: activeStudent.email,
        regNumber: activeStudent.regNumber,
        campus: activeStudent.campus,
        studyCampus: data.studyCampus,
        phone: data.phone,
        roomType: data.roomType,
        accessibility: data.accessibility,
        comments: data.comments,
        status: 'pending',
        assignedRoom: '',
        localKey: createId('application'),
      });
      return { success: true, message: 'Application submitted successfully.' };
    } catch (error) {
      console.error('Failed to create application:', error);
      return { success: false, message: 'Failed to submit application to Database.' };
    }
  };

  const handleUpdateRoom = async (roomId, updates) => {
    const existingRoom = roomInventory.find((room) => room.id === roomId);
    if (!existingRoom) {
      return { success: false, message: 'Room category not found.' };
    }

    const nextTotal = Number(updates.total);
    if (Number.isNaN(nextTotal) || nextTotal < 0) {
      return { success: false, message: 'Room totals must be a valid positive number.' };
    }

    const occupiedRoomsForCategory = getApprovedCountForRoom(applications, existingRoom);
    if (nextTotal < occupiedRoomsForCategory) {
      return {
        success: false,
        message: `You cannot reduce below ${occupiedRoomsForCategory} approved allocations for this room.`,
      };
    }

    try {
      await updateRoom(roomId, {
        total: nextTotal,
        status: updates.status,
      });
      return { success: true, message: `${existingRoom.label} updated successfully.` };
    } catch (error) {
      console.error('Failed to update room:', error);
      return { success: false, message: 'Failed to save room changes to Database.' };
    }
  };

  const handleUpdateApplication = async (applicationId, updates) => {
    const application = applications.find((entry) => entry.id === applicationId);
    if (!application) {
      return { success: false, message: 'Application not found.' };
    }

    const nextStatus = updates.status ?? application.status;
    const relatedRoom = roomInventory.find(
      (room) => room.campus === application.campus && room.typeKey === application.roomType
    );

    if (nextStatus === 'approved') {
      if (!relatedRoom) {
        return { success: false, message: 'No room configuration exists for this campus and room type.' };
      }

      if (relatedRoom.status === 'closed') {
        return { success: false, message: 'This room type is closed. Reopen it before approving.' };
      }

      const approvedCountWithoutCurrent = applications.filter(
        (entry) =>
          entry.id !== application.id &&
          entry.status === 'approved' &&
          entry.campus === application.campus &&
          entry.roomType === application.roomType
      ).length;

      if (approvedCountWithoutCurrent >= relatedRoom.total) {
        return { success: false, message: 'No more capacity remains for this room type.' };
      }
    }

    try {
      await updateApplication(applicationId, {
        status: nextStatus,
        assignedRoom: updates.assignedRoom ?? application.assignedRoom ?? '',
        reviewedAt: nextStatus === 'pending' ? '' : new Date().toISOString(),
      });
      return { success: true, message: `Application moved to ${nextStatus}.` };
    } catch (error) {
      console.error('Failed to update application:', error);
      return { success: false, message: 'Failed to update application in Database.' };
    }
  };

  const handleProfileImageUpload = async (profileImageFile) => {
    if (!activeStudent) {
      return { success: false, message: 'Student session not found.' };
    }

    try {
      const accountKey = getUserAccountKey(activeStudent);
      const relatedUserIds = users
        .filter((user) => getUserAccountKey(user) === accountKey)
        .map((user) => user.id);
      const profileImage = await withTimeout(
        uploadProfileImage(activeStudent.id, profileImageFile),
        'The profile image upload took too long. Please try again.'
      );

      await withTimeout(
        relatedUserIds.length > 1
          ? updateUserProfileImageForUsers(relatedUserIds, profileImage)
          : updateUserProfileImage(activeStudent.id, profileImage),
        'The image uploaded, but saving it to your profile took too long. Please try again.'
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          getUserAccountKey(user) === accountKey
            ? {
                ...user,
                profileImageUrl: profileImage.url,
                profileImagePath: profileImage.path,
                profileImageUpdatedAt: profileImage.updatedAt,
              }
            : user
        )
      );

      return {
        success: true,
        url: buildProfileImageSrc(profileImage.url, profileImage.updatedAt),
        profileImageUrl: profileImage.url,
        profileImageUpdatedAt: profileImage.updatedAt,
      };
    } catch (error) {
      console.error('Failed to upload profile image:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload the profile image to Database Storage. Check your storage rules.',
      };
    }
  };

  const handleLogout = () => {
    setSession(null);
  };

  const headerRole = session?.role ?? 'guest';
  const pageSubtitle =
    headerRole === 'admin'
      ? 'Admin monitor for reports, applicants, and room operations'
      : headerRole === 'student'
        ? `${activeStudent?.campus === 'RP' ? 'Rwanda Polytechnic' : 'University of Rwanda'} Student Dashboard`
        : 'Secure hostel application and admin monitoring system';

  return (
    <div className={`app ${theme}`}>
      <header className="site-header">
        <div className="header-content">
          <div className="header-logos">
            {headerRole === 'admin' ? (
              <div className="campus-symbol admin-symbol">
                <FaUserShield />
                <span>ADMIN</span>
              </div>
            ) : headerRole === 'student' ? (
              <div className={`campus-symbol ${activeStudent?.campus === 'RP' ? 'rp-symbol' : 'ur-symbol'}`}>
                <FaGraduationCap />
                <span>{activeStudent?.campus}</span>
              </div>
            ) : (
              <>
                <div className="campus-symbol ur-symbol">
                  <FaGraduationCap />
                  <span>UR</span>
                </div>
                <div className="campus-symbol rp-symbol">
                  <FaGraduationCap />
                  <span>RP</span>
                </div>
                <div className="campus-symbol admin-symbol">
                  <FaUserShield />
                  <span>ADMIN</span>
                </div>
              </>
            )}
          </div>
          <h1 className="site-title">CampusStay Portal</h1>
          <p className="site-subtitle">{pageSubtitle}</p>
        </div>
      </header>

      {syncError && <div className="sync-banner">{syncError}</div>}

      {session?.role === 'admin' ? (
        <AdminPortal
          onLogout={handleLogout}
          applications={applications}
          roomInventory={roomInventory}
          registeredUsers={users}
          onUpdateRoom={handleUpdateRoom}
          onUpdateApplication={handleUpdateApplication}
        />
      ) : session?.role === 'student' && activeStudent ? (
        <Dashboard
          onLogout={handleLogout}
          student={activeStudent}
          campus={activeStudent.campus}
          totalRooms={totalRooms}
          occupiedRooms={occupiedRooms}
          remainingRooms={remainingRooms}
          roomClosed={roomClosed}
          pastDeadline={pastDeadline}
          deadline={APPLICATION_DEADLINE}
          latestApplication={latestStudentApplication}
          studentApplications={studentApplications}
          onRoomApplication={handleRoomApplication}
          onProfileImageUpload={handleProfileImageUpload}
        />
      ) : (
        <Login
          onStudentLogin={handleStudentLogin}
          onAdminLogin={handleAdminLogin}
          onRegister={handleRegister}
          registeredUsersCount={users.length}
          isSyncing={isSyncing}
        />
      )}

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <strong>POWER BY HUSSEIN BARAME</strong>
            <p>Professional student hostel and admin portal for UR and RP campus communities.</p>
          </div>
          <div className="footer-contact">
            <h4>Contact</h4>
            <p>
              Email: <a href="mailto:baramehussein@158gmail.com">baramehussein@158gmail.com</a>
            </p>
            <p>Phone: +250 788 123 456</p>
            <p>Location: Kigali, Rwanda</p>
          </div>
          <div className="footer-links">
            <h4>Quick links</h4>
            <p>Student login</p>
            <p>Admin monitor</p>
            <p>Hostel application</p>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; 2026 POWER BY HUSSEIN BARAME. All rights reserved. Crafted for secure campus housing
          application and monitoring experiences.
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
