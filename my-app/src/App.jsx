import React, { useEffect, useMemo, useState } from 'react';
import { FaGraduationCap, FaUserShield } from 'react-icons/fa';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPortal from './components/AdminPortal';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import {
  ADMIN_ACCOUNT,
  HOSTEL_RENT_BY_ROOM_TYPE,
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
  createPasswordResetRequest,
  createUser,
  deleteApplicationsByIds,
  deleteUsersByIds,
  ensureRoomInventorySeeded,
  subscribeToApplications,
  subscribeToPasswordResetRequests,
  subscribeToRooms,
  subscribeToUsers,
  updateApplicationsByIds,
  updateApplication,
  updateRoom,
  updatePasswordResetRequest,
  updateUserProfileForUsers,
  updateUserProfileImage,
  updateUserProfileImageForUsers,
  updateUserPasswordForUsers,
  uploadProfileImage,
} from './services/portalRepository';
import './App.scss';

const APPLICATION_DEADLINE = new Date('2026-05-15T23:59:59');
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const getLatestApplicationForStudent = (applications, student) => {
  if (!student) {
    return null;
  }

  const accountKey = getUserAccountKey(student);
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
          application.studentId === student.id ||
          (accountKey && applicationAccountKey === accountKey) ||
          application.regNumber?.toLowerCase() === student.regNumber?.toLowerCase() ||
          application.email?.toLowerCase() === student.email?.toLowerCase()
        );
      })
    )[0] ?? null
  );
};

const getStudentApplications = (applications, student) => {
  if (!student) {
    return [];
  }

  const accountKey = getUserAccountKey(student);
  return sortApplicationsByDate(
    applications.filter((application) => {
      const applicationAccountKey =
        application.studentAccountKey ||
        getUserAccountKey({
          campus: application.campus,
          regNumber: application.regNumber,
          email: application.email,
        });

      return (
        application.studentId === student.id ||
        (accountKey && applicationAccountKey === accountKey) ||
        application.regNumber?.toLowerCase() === student.regNumber?.toLowerCase() ||
        application.email?.toLowerCase() === student.email?.toLowerCase()
      );
    })
  );
};

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

const getStudentAccountKeyFromIdentity = ({ campus, regNumber, email }) =>
  getUserAccountKey({
    campus,
    regNumber,
    email,
  });

const generateResetCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

function AppContent() {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
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
      passwordResetRequests: false,
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

    const unsubscribePasswordResetRequests = subscribeToPasswordResetRequests(
      (nextRequests) => {
        if (!isMounted) {
          return;
        }
        setPasswordResetRequests(nextRequests);
        markLoaded('passwordResetRequests');
      },
      (error) => {
        console.error('Password reset requests subscription failed:', error);
        if (isMounted) {
          setSyncError('Could not load password reset requests from database.');
          markLoaded('passwordResetRequests');
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
      unsubscribePasswordResetRequests();
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

  const latestStudentApplication = getLatestApplicationForStudent(applications, activeStudent);
  const studentApplications = getStudentApplications(applications, activeStudent);
  const latestPasswordResetRequest = findLatestPasswordResetRequestForStudent(activeStudent);

  const { campusRooms, totalRooms, occupiedRooms, remainingRooms } = activeStudent
    ? getCampusRoomStats(applications, roomInventory, activeStudent.campus)
    : { campusRooms: [], totalRooms: 0, occupiedRooms: 0, remainingRooms: 0 };

  const pastDeadline = new Date() > APPLICATION_DEADLINE;
  const roomClosed =
    pastDeadline ||
    remainingRooms <= 0 ||
    (campusRooms.length > 0 && campusRooms.every((room) => room.status === 'closed'));

  const findStudentByIdentity = (identity) => {
    const normalizedEmail = identity.email?.trim().toLowerCase() ?? '';
    const normalizedRegNumber = identity.regNumber?.trim().toLowerCase() ?? '';
    const normalizedCampus = identity.campus?.trim().toUpperCase() ?? '';
    const normalizedGender = identity.gender?.trim().toLowerCase() ?? '';

    return (
      users.find(
        (user) =>
          user.email?.toLowerCase() === normalizedEmail &&
          user.regNumber?.toLowerCase() === normalizedRegNumber &&
          user.campus?.toUpperCase() === normalizedCampus &&
          user.gender?.toLowerCase() === normalizedGender
      ) ?? null
    );
  };

  const findLatestPasswordResetRequestForStudent = (student) => {
    if (!student) {
      return null;
    }

    const studentAccountKey = getUserAccountKey(student);
    return (
      [...passwordResetRequests]
        .filter((request) => {
          const requestAccountKey =
            request.studentAccountKey ||
            getStudentAccountKeyFromIdentity({
              campus: request.campus,
              regNumber: request.regNumber,
              email: request.email,
            });

          return (
            request.studentId === student.id ||
            (studentAccountKey && requestAccountKey === studentAccountKey) ||
            request.regNumber?.toLowerCase() === student.regNumber?.toLowerCase() ||
            request.email?.toLowerCase() === student.email?.toLowerCase()
          );
        })
        .sort((left, right) => new Date(right.requestedAt ?? 0) - new Date(left.requestedAt ?? 0))[0] ?? null
    );
  };

  const handleStudentLogin = async (credentials) => {
    if (isSyncing) {
      return { success: false, message: 'Database data is still loading. Please wait a moment and try again.' };
    }

    const matchedUser = users.find(
      (user) =>
        credentials.email.toLowerCase() === user.email.toLowerCase() &&
        credentials.password === user.password &&
        credentials.regNumber.toLowerCase() === user.regNumber.toLowerCase() &&
        credentials.campus === user.campus &&
        (!credentials.gender || !user.gender || credentials.gender === user.gender)
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
    if (!user.gender) {
      return { success: false, message: 'Please choose a gender before creating your account.' };
    }

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
        allowAdminUpdates: Boolean(user.allowAdminUpdates),
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

    if (!data.gender) {
      return { success: false, message: 'Please select a gender for this hostel application.' };
    }

    const latestApplication = getLatestApplicationForStudent(applications, activeStudent);
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

    const expectedRentAmount = HOSTEL_RENT_BY_ROOM_TYPE[data.roomType];
    const amountPaid = Number(data.amountPaid);
    const accountKey = getUserAccountKey(activeStudent);
    const relatedUserIds = users
      .filter((user) => getUserAccountKey(user) === accountKey)
      .map((user) => user.id);

    if (!expectedRentAmount) {
      return { success: false, message: 'Selected room pricing could not be loaded. Please try again.' };
    }

    if (Number.isNaN(amountPaid) || amountPaid < expectedRentAmount) {
      return {
        success: false,
        message: 'The full hostel rent must be entered before your application can be submitted.',
      };
    }

    try {
      if (relatedUserIds.length > 0) {
        await updateUserProfileForUsers(relatedUserIds, {
          gender: data.gender,
          allowAdminUpdates: Boolean(data.allowAdminUpdates),
          updatedAt: new Date().toISOString(),
        });
      }

      await createApplication({
        studentId: activeStudent.id,
        studentAccountKey: accountKey,
        name: activeStudent.name,
        email: activeStudent.email,
        regNumber: activeStudent.regNumber,
        campus: activeStudent.campus,
        gender: data.gender,
        allowAdminUpdates: Boolean(data.allowAdminUpdates),
        studyCampus: data.studyCampus,
        phone: data.phone,
        roomType: data.roomType,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        amountPaid,
        expectedRentAmount,
        paymentStatus: 'pending',
        paymentSubmittedAt: new Date().toISOString(),
        paymentVerifiedAt: '',
        paymentVerifiedBy: '',
        paymentVerificationNotes: '',
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

  const handlePasswordResetRequest = async (data) => {
    const matchedStudent = findStudentByIdentity(data);

    if (!matchedStudent) {
      return {
        success: false,
        message: 'We could not match those details to a student account. Check the email, reg number, campus, and gender.',
      };
    }

    const existingOpenRequest = passwordResetRequests.find((request) => {
      const requestAccountKey =
        request.studentAccountKey ||
        getStudentAccountKeyFromIdentity({
          campus: request.campus,
          regNumber: request.regNumber,
          email: request.email,
        });

      return (
        request.status !== 'used' &&
        request.status !== 'rejected' &&
        (request.studentId === matchedStudent.id ||
          requestAccountKey === getUserAccountKey(matchedStudent) ||
          request.regNumber?.toLowerCase() === matchedStudent.regNumber?.toLowerCase() ||
          request.email?.toLowerCase() === matchedStudent.email?.toLowerCase())
      );
    });

    if (existingOpenRequest) {
      return {
        success: false,
        message: 'A password reset request already exists for this account. Wait for the admin to review it.',
      };
    }

    try {
      await createPasswordResetRequest({
        studentId: matchedStudent.id,
        studentAccountKey: getUserAccountKey(matchedStudent),
        name: matchedStudent.name,
        email: matchedStudent.email,
        regNumber: matchedStudent.regNumber,
        campus: matchedStudent.campus,
        gender: matchedStudent.gender,
        reason: data.reason?.trim() || '',
        status: 'pending',
        resetCode: '',
        resetCodeIssuedAt: '',
        resetCodeExpiresAt: '',
        resetCodeUsedAt: '',
        adminReviewedBy: '',
      });

      return {
        success: true,
        message: 'Password reset request sent to the admin. Wait for a one-time code to be issued.',
      };
    } catch (error) {
      console.error('Failed to create password reset request:', error);
      return { success: false, message: 'Failed to send the password reset request to Database.' };
    }
  };

  const handlePasswordResetReview = async (requestId, action) => {
    const request = passwordResetRequests.find((entry) => entry.id === requestId);
    if (!request) {
      return { success: false, message: 'Password reset request not found.' };
    }

    if (action === 'reject') {
      try {
        await updatePasswordResetRequest(requestId, {
          status: 'rejected',
          reviewedAt: new Date().toISOString(),
          adminReviewedBy: ADMIN_ACCOUNT.email,
          resetCode: '',
          resetCodeIssuedAt: '',
          resetCodeExpiresAt: '',
        });
        return { success: true, message: `Password reset request for ${request.name} was rejected.` };
      } catch (error) {
        console.error('Failed to reject password reset request:', error);
        return { success: false, message: 'Failed to update the reset request in Database.' };
      }
    }

    const generatedCode = generateResetCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    try {
      await updatePasswordResetRequest(requestId, {
        status: 'approved',
        reviewedAt: now.toISOString(),
        adminReviewedBy: ADMIN_ACCOUNT.email,
        resetCode: generatedCode,
        resetCodeIssuedAt: now.toISOString(),
        resetCodeExpiresAt: expiresAt,
        resetCodeUsedAt: '',
      });

      return {
        success: true,
        message: `One-time reset code generated for ${request.name}: ${generatedCode}`,
        resetCode: generatedCode,
      };
    } catch (error) {
      console.error('Failed to approve password reset request:', error);
      return { success: false, message: 'Failed to issue the reset code in Database.' };
    }
  };

  const handlePasswordResetConfirm = async (data) => {
    const matchedStudent = findStudentByIdentity(data);
    if (!matchedStudent) {
      return {
        success: false,
        message: 'We could not match those details to a student account. Check the email, reg number, campus, and gender.',
      };
    }

    if (!PASSWORD_POLICY.test(data.newPassword)) {
      return {
        success: false,
        message: 'New password must include uppercase, lowercase, a number, a symbol, and at least 8 characters.',
      };
    }

    const request = passwordResetRequests.find((entry) => {
      const requestAccountKey =
        entry.studentAccountKey ||
        getStudentAccountKeyFromIdentity({
          campus: entry.campus,
          regNumber: entry.regNumber,
          email: entry.email,
        });

      return (
        entry.status === 'approved' &&
        entry.resetCode === data.resetCode?.trim() &&
        (entry.studentId === matchedStudent.id ||
          requestAccountKey === getUserAccountKey(matchedStudent) ||
          entry.regNumber?.toLowerCase() === matchedStudent.regNumber?.toLowerCase() ||
          entry.email?.toLowerCase() === matchedStudent.email?.toLowerCase())
      );
    });

    if (!request) {
      return {
        success: false,
        message: 'That reset code is not valid, has already been used, or has not been approved yet.',
      };
    }

    if (request.resetCodeExpiresAt && new Date(request.resetCodeExpiresAt) < new Date()) {
      return { success: false, message: 'That reset code has expired. Please ask the admin to generate a new one.' };
    }

    const accountKey = getUserAccountKey(matchedStudent);
    const relatedUserIds = users
      .filter((user) => getUserAccountKey(user) === accountKey)
      .map((user) => user.id);

    try {
      await updateUserPasswordForUsers(relatedUserIds, data.newPassword);
      await updatePasswordResetRequest(request.id, {
        status: 'used',
        resetCodeUsedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Your password has been updated successfully. The reset code can only be used once.',
      };
    } catch (error) {
      console.error('Failed to apply password reset:', error);
      return { success: false, message: 'Failed to update the password in Database.' };
    }
  };

  const handleUpdateStudent = async (studentId, updates) => {
    const student = users.find((user) => user.id === studentId);
    if (!student) {
      return { success: false, message: 'Student account not found.' };
    }

    if (!student.allowAdminUpdates) {
      return {
        success: false,
        message: 'This student has not allowed admin updates yet. Ask the student to enable access first.',
      };
    }

    const nextName = updates.name?.trim() ?? student.name;
    const nextEmail = updates.email?.trim() ?? student.email;
    const nextRegNumber = updates.regNumber?.trim() ?? student.regNumber;
    const nextCampus = updates.campus?.trim() ?? student.campus;
    const nextGender = updates.gender ?? student.gender;

    if (!nextName || !nextEmail || !nextRegNumber || !nextCampus || !nextGender) {
      return { success: false, message: 'All student details must be complete before saving changes.' };
    }

    const duplicateEmail = users.some(
      (existingUser) =>
        existingUser.id !== student.id && existingUser.email?.toLowerCase() === nextEmail.toLowerCase()
    );
    if (duplicateEmail) {
      return { success: false, message: 'Another student already uses that email address.' };
    }

    const duplicateRegNumber = users.some(
      (existingUser) =>
        existingUser.id !== student.id && existingUser.regNumber?.toLowerCase() === nextRegNumber.toLowerCase()
    );
    if (duplicateRegNumber) {
      return { success: false, message: 'Another student already uses that registration number.' };
    }

    const currentAccountKey = getUserAccountKey(student);
    const relatedUsers = users.filter((user) => getUserAccountKey(user) === currentAccountKey);
    const relatedUserIds = relatedUsers.map((user) => user.id);
    const relatedApplicationIds = applications
      .filter((application) => {
        const applicationAccountKey =
          application.studentAccountKey ||
          getUserAccountKey({
            campus: application.campus,
            regNumber: application.regNumber,
            email: application.email,
          });

        return (
          application.studentId === student.id ||
          applicationAccountKey === currentAccountKey ||
          application.regNumber?.toLowerCase() === student.regNumber?.toLowerCase() ||
          application.email?.toLowerCase() === student.email?.toLowerCase()
        );
      })
      .map((application) => application.id);

    const updatedAccountKey = getUserAccountKey({
      campus: nextCampus,
      regNumber: nextRegNumber,
      email: nextEmail,
    });

    try {
      await updateUserProfileForUsers(relatedUserIds, {
        name: nextName,
        email: nextEmail,
        regNumber: nextRegNumber,
        campus: nextCampus,
        gender: nextGender,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
        accountKey: updatedAccountKey,
      });

      await updateApplicationsByIds(relatedApplicationIds, {
        name: nextName,
        email: nextEmail,
        regNumber: nextRegNumber,
        campus: nextCampus,
        gender: nextGender,
        studentAccountKey: updatedAccountKey,
      });

      return { success: true, message: `${nextName}'s account was updated successfully.` };
    } catch (error) {
      console.error('Failed to update student account:', error);
      return { success: false, message: 'Failed to update the student account in Database.' };
    }
  };

  const handleDeleteStudent = async (studentId) => {
    const student = users.find((user) => user.id === studentId);
    if (!student) {
      return { success: false, message: 'Student account not found.' };
    }

    const accountKey = getUserAccountKey(student);
    const relatedUsers = users.filter((user) => getUserAccountKey(user) === accountKey);
    const relatedUserIds = relatedUsers.map((user) => user.id);
    const relatedApplicationIds = applications
      .filter((application) => {
        const applicationAccountKey =
          application.studentAccountKey ||
          getUserAccountKey({
            campus: application.campus,
            regNumber: application.regNumber,
            email: application.email,
          });

        return (
          application.studentId === student.id ||
          applicationAccountKey === accountKey ||
          application.regNumber?.toLowerCase() === student.regNumber?.toLowerCase() ||
          application.email?.toLowerCase() === student.email?.toLowerCase()
        );
      })
      .map((application) => application.id);

    try {
      await deleteApplicationsByIds(relatedApplicationIds);
      await deleteUsersByIds(relatedUserIds);
      return { success: true, message: `${student.name}'s account was deleted successfully.` };
    } catch (error) {
      console.error('Failed to delete student account:', error);
      return { success: false, message: 'Failed to delete the student account from Database.' };
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
    const currentPaymentStatus = application.paymentStatus ?? 'pending';
    const nextPaymentStatus = updates.paymentStatus ?? currentPaymentStatus;
    const relatedRoom = roomInventory.find(
      (room) => room.campus === application.campus && room.typeKey === application.roomType
    );

    if (nextStatus === 'approved') {
      if (nextPaymentStatus !== 'verified') {
        return {
          success: false,
          message: 'Verify the student payment first before approving the hostel allocation.',
        };
      }

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

    if (application.status === 'approved' && nextPaymentStatus !== 'verified') {
      return {
        success: false,
        message: 'Approved applications must keep a verified payment record.',
      };
    }

    try {
      const paymentStatusChanged = nextPaymentStatus !== currentPaymentStatus;
      const payload = {
        status: nextStatus,
        assignedRoom: updates.assignedRoom ?? application.assignedRoom ?? '',
        reviewedAt: nextStatus === 'pending' ? '' : new Date().toISOString(),
        paymentStatus: nextPaymentStatus,
        paymentVerificationNotes: updates.paymentVerificationNotes ?? application.paymentVerificationNotes ?? '',
      };

      if (paymentStatusChanged) {
        payload.paymentVerifiedAt = nextPaymentStatus === 'verified' ? new Date().toISOString() : '';
        payload.paymentVerifiedBy = nextPaymentStatus === 'verified' ? ADMIN_ACCOUNT.email : '';
      }

      await updateApplication(applicationId, {
        ...payload,
      });

      if (updates.paymentStatus && updates.paymentStatus !== currentPaymentStatus) {
        const paymentLabel = updates.paymentStatus === 'verified' ? 'verified' : 'marked for follow-up';
        return { success: true, message: `Payment ${paymentLabel} for ${application.name}.` };
      }

      return { success: true, message: `Application moved to ${nextStatus}.` };
    } catch (error) {
      console.error('Failed to update application:', error);
      return { success: false, message: 'Failed to update application in Database.' };
    }
  };

  const handleResetStudentPassword = async ({ userId, nextPassword }) => {
    const student = users.find((user) => user.id === userId);
    if (!student) {
      return { success: false, message: 'Student account not found.' };
    }

    if (!student.allowAdminUpdates) {
      return {
        success: false,
        message: 'This student has not allowed admin updates yet, so the password cannot be changed.',
      };
    }

    if (!PASSWORD_POLICY.test(nextPassword)) {
      return {
        success: false,
        message: 'New password must include uppercase, lowercase, a number, a symbol, and at least 8 characters.',
      };
    }

    try {
      const accountKey = getUserAccountKey(student);
      const relatedUserIds = users
        .filter((user) => getUserAccountKey(user) === accountKey)
        .map((user) => user.id);

      await updateUserPasswordForUsers(relatedUserIds, nextPassword);
      return {
        success: true,
        message: `Password reset completed for ${student.name}. Share the new password securely with the student.`,
      };
    } catch (error) {
      console.error('Failed to reset student password:', error);
      return { success: false, message: 'Failed to reset the student password in Database.' };
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
      const profileImage = await uploadProfileImage(activeStudent.id, profileImageFile);

      await (
        relatedUserIds.length > 1
          ? updateUserProfileImageForUsers(relatedUserIds, profileImage)
          : updateUserProfileImage(activeStudent.id, profileImage)
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
          passwordResetRequests={passwordResetRequests}
          onUpdateRoom={handleUpdateRoom}
          onUpdateApplication={handleUpdateApplication}
          onResetStudentPassword={handleResetStudentPassword}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          onReviewPasswordResetRequest={handlePasswordResetReview}
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
          latestPasswordResetRequest={latestPasswordResetRequest}
          onRoomApplication={handleRoomApplication}
          onProfileImageUpload={handleProfileImageUpload}
        />
      ) : (
        <Login
          onStudentLogin={handleStudentLogin}
          onAdminLogin={handleAdminLogin}
          onRegister={handleRegister}
          onPasswordResetRequest={handlePasswordResetRequest}
          onPasswordResetConfirm={handlePasswordResetConfirm}
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
