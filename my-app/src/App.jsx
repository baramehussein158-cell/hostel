import React, { useEffect, useState } from 'react';
import { FaGraduationCap, FaUserShield } from 'react-icons/fa';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPortal from './components/AdminPortal';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import {
  ADMIN_ACCOUNT,
  DEFAULT_ROOM_INVENTORY,
  STORAGE_KEYS,
  createId,
  readStoredValue,
  sortApplicationsByDate,
} from './data/portalData';
import './App.scss';

const APPLICATION_DEADLINE = new Date('2026-05-15T23:59:59');

const getLatestApplicationForStudent = (applications, regNumber) =>
  sortApplicationsByDate(applications.filter((application) => application.regNumber === regNumber))[0] ?? null;

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
  const [users, setUsers] = useState(() => readStoredValue(STORAGE_KEYS.users, []));
  const [applications, setApplications] = useState(() =>
    sortApplicationsByDate(readStoredValue(STORAGE_KEYS.applications, []))
  );
  const [roomInventory, setRoomInventory] = useState(() =>
    readStoredValue(STORAGE_KEYS.rooms, DEFAULT_ROOM_INVENTORY)
  );
  const [session, setSession] = useState(() => readStoredValue(STORAGE_KEYS.session, null));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(roomInventory));
  }, [roomInventory]);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
      return;
    }

    localStorage.removeItem(STORAGE_KEYS.session);
  }, [session]);

  const activeStudent = session?.role === 'student' ? session.user : null;
  const latestStudentApplication = activeStudent
    ? getLatestApplicationForStudent(applications, activeStudent.regNumber)
    : null;
  const studentApplications = activeStudent
    ? sortApplicationsByDate(
        applications.filter((application) => application.regNumber === activeStudent.regNumber)
      )
    : [];

  const {
    campusRooms,
    totalRooms,
    occupiedRooms,
    remainingRooms,
  } = activeStudent
    ? getCampusRoomStats(applications, roomInventory, activeStudent.campus)
    : { campusRooms: [], totalRooms: 0, occupiedRooms: 0, remainingRooms: 0 };

  const pastDeadline = new Date() > APPLICATION_DEADLINE;
  const roomClosed =
    pastDeadline ||
    remainingRooms <= 0 ||
    (campusRooms.length > 0 && campusRooms.every((room) => room.status === 'closed'));

  const handleStudentLogin = (credentials) => {
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
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        regNumber: matchedUser.regNumber,
        campus: matchedUser.campus,
      },
    });

    return { success: true };
  };

  const handleAdminLogin = (credentials) => {
    const validAdmin =
      credentials.email.toLowerCase() === ADMIN_ACCOUNT.email.toLowerCase() &&
      credentials.password === ADMIN_ACCOUNT.password;

    if (!validAdmin) {
      return { success: false, message: 'Invalid admin credentials. Use the configured admin account.' };
    }

    setSession({
      role: 'admin',
      user: {
        name: ADMIN_ACCOUNT.name,
        email: ADMIN_ACCOUNT.email,
      },
    });

    return { success: true };
  };

  const handleRegister = (user) => {
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

    const newUser = {
      id: createId('user'),
      ...user,
      createdAt: new Date().toISOString(),
    };

    setUsers((currentUsers) => [newUser, ...currentUsers]);
    return { success: true, message: 'Account created successfully. You can now log in.' };
  };

  const handleRoomApplication = (data) => {
    if (!activeStudent) {
      return { success: false, message: 'Please log in as a student before applying.' };
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

    const newApplication = {
      id: createId('application'),
      studentId: activeStudent.id ?? null,
      name: activeStudent.name,
      email: activeStudent.email,
      regNumber: activeStudent.regNumber,
      campus: activeStudent.campus,
      phone: data.phone,
      roomType: data.roomType,
      accessibility: data.accessibility,
      comments: data.comments,
      status: 'pending',
      assignedRoom: '',
      submittedAt: new Date().toISOString(),
    };

    setApplications((currentApplications) => sortApplicationsByDate([newApplication, ...currentApplications]));
    return { success: true, message: 'Application submitted successfully.' };
  };

  const handleUpdateRoom = (roomId, updates) => {
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

    setRoomInventory((currentRooms) =>
      currentRooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              total: nextTotal,
              status: updates.status,
            }
          : room
      )
    );

    return { success: true, message: `${existingRoom.label} updated successfully.` };
  };

  const handleUpdateApplication = (applicationId, updates) => {
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

    setApplications((currentApplications) =>
      sortApplicationsByDate(
        currentApplications.map((entry) =>
          entry.id === applicationId
            ? {
                ...entry,
                status: nextStatus,
                assignedRoom: updates.assignedRoom ?? entry.assignedRoom,
                reviewedAt: nextStatus === 'pending' ? undefined : new Date().toISOString(),
              }
            : entry
        )
      )
    );

    return { success: true, message: `Application moved to ${nextStatus}.` };
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
        />
      ) : (
        <Login
          onStudentLogin={handleStudentLogin}
          onAdminLogin={handleAdminLogin}
          onRegister={handleRegister}
          registeredUsersCount={users.length}
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
