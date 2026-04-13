import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../lib/firebaseConfig';
import { DEFAULT_ROOM_INVENTORY, sortApplicationsByDate } from '../data/portalData';

const collections = {
  applications: 'applications',
  rooms: 'rooms',
  users: 'users',
};

const getFileExtension = (profileImageFile) => {
  const fileName = profileImageFile?.name ?? '';
  const fileNameParts = fileName.split('.');
  const fileExtensionFromName = fileNameParts.length > 1 ? fileNameParts.pop().toLowerCase() : '';

  if (fileExtensionFromName) {
    return fileExtensionFromName;
  }

  const mimeType = profileImageFile?.type ?? '';
  const mimeExtension = mimeType.split('/')[1]?.toLowerCase();
  return mimeExtension || 'jpg';
};

const mapSnapshotDocs = (snapshot) =>
  snapshot.docs.map((snapshotDoc) => ({
    id: snapshotDoc.id,
    ...snapshotDoc.data(),
  }));

export const ensureRoomInventorySeeded = async () => {
  const roomsCollection = collection(db, collections.rooms);
  const snapshot = await getDocs(roomsCollection);
  const existingIds = new Set(snapshot.docs.map((snapshotDoc) => snapshotDoc.id));
  const missingRooms = DEFAULT_ROOM_INVENTORY.filter((room) => !existingIds.has(room.id));

  if (missingRooms.length === 0) {
    return;
  }

  const batch = writeBatch(db);
  missingRooms.forEach((room) => {
    batch.set(doc(db, collections.rooms, room.id), room);
  });
  await batch.commit();
};

export const subscribeToUsers = (onData, onError) =>
  onSnapshot(
    collection(db, collections.users),
    (snapshot) => {
      const users = mapSnapshotDocs(snapshot).sort(
        (left, right) => new Date(right.createdAt ?? 0) - new Date(left.createdAt ?? 0)
      );
      onData(users);
    },
    onError
  );

export const subscribeToApplications = (onData, onError) =>
  onSnapshot(
    collection(db, collections.applications),
    (snapshot) => {
      onData(sortApplicationsByDate(mapSnapshotDocs(snapshot)));
    },
    onError
  );

export const subscribeToRooms = (onData, onError) =>
  onSnapshot(
    collection(db, collections.rooms),
    (snapshot) => {
      const roomOrder = DEFAULT_ROOM_INVENTORY.map((room) => room.id);
      const rooms = mapSnapshotDocs(snapshot).sort(
        (left, right) => roomOrder.indexOf(left.id) - roomOrder.indexOf(right.id)
      );
      onData(rooms);
    },
    onError
  );

export const createUser = async (user) => {
  const userPayload = {
    ...user,
    createdAt: new Date().toISOString(),
    profileImageUrl: '',
    profileImagePath: '',
    profileImageUpdatedAt: '',
  };
  const documentRef = await addDoc(collection(db, collections.users), userPayload);
  return { id: documentRef.id, ...userPayload };
};

export const createApplication = async (application) => {
  const applicationPayload = {
    ...application,
    submittedAt: new Date().toISOString(),
  };
  const documentRef = await addDoc(collection(db, collections.applications), applicationPayload);
  return { id: documentRef.id, ...applicationPayload };
};

export const updateRoom = async (roomId, updates) => {
  await updateDoc(doc(db, collections.rooms, roomId), updates);
};

export const updateApplication = async (applicationId, updates) => {
  await updateDoc(doc(db, collections.applications, applicationId), updates);
};

export const updateApplicationsByIds = async (applicationIds, updates) => {
  const uniqueApplicationIds = [...new Set(applicationIds)].filter(Boolean);
  if (uniqueApplicationIds.length === 0) {
    return;
  }

  if (uniqueApplicationIds.length === 1) {
    await updateApplication(uniqueApplicationIds[0], updates);
    return;
  }

  const batch = writeBatch(db);
  uniqueApplicationIds.forEach((applicationId) => {
    batch.update(doc(db, collections.applications, applicationId), updates);
  });
  await batch.commit();
};

export const updateUserProfileImage = async (userId, profileImage) => {
  await updateDoc(doc(db, collections.users, userId), {
    profileImageUrl: profileImage.url,
    profileImagePath: profileImage.path,
    profileImageUpdatedAt: profileImage.updatedAt,
  });
};

export const updateUserProfileImageForUsers = async (userIds, profileImage) => {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueUserIds.length === 0) {
    return;
  }

  if (uniqueUserIds.length === 1) {
    await updateUserProfileImage(uniqueUserIds[0], profileImage);
    return;
  }

  const batch = writeBatch(db);
  uniqueUserIds.forEach((userId) => {
    batch.update(doc(db, collections.users, userId), {
      profileImageUrl: profileImage.url,
      profileImagePath: profileImage.path,
      profileImageUpdatedAt: profileImage.updatedAt,
    });
  });
  await batch.commit();
};

export const updateUserProfile = async (userId, updates) => {
  await updateDoc(doc(db, collections.users, userId), updates);
};

export const updateUserProfileForUsers = async (userIds, updates) => {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueUserIds.length === 0) {
    return;
  }

  if (uniqueUserIds.length === 1) {
    await updateUserProfile(uniqueUserIds[0], updates);
    return;
  }

  const batch = writeBatch(db);
  uniqueUserIds.forEach((userId) => {
    batch.update(doc(db, collections.users, userId), updates);
  });
  await batch.commit();
};

export const updateUserPassword = async (userId, password) => {
  await updateDoc(doc(db, collections.users, userId), {
    password,
    passwordUpdatedAt: new Date().toISOString(),
  });
};

export const updateUserPasswordForUsers = async (userIds, password) => {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueUserIds.length === 0) {
    return;
  }

  if (uniqueUserIds.length === 1) {
    await updateUserPassword(uniqueUserIds[0], password);
    return;
  }

  const batch = writeBatch(db);
  const passwordUpdatedAt = new Date().toISOString();
  uniqueUserIds.forEach((userId) => {
    batch.update(doc(db, collections.users, userId), {
      password,
      passwordUpdatedAt,
    });
  });
  await batch.commit();
};

export const deleteUsersByIds = async (userIds) => {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueUserIds.length === 0) {
    return;
  }

  if (uniqueUserIds.length === 1) {
    await deleteDoc(doc(db, collections.users, uniqueUserIds[0]));
    return;
  }

  const batch = writeBatch(db);
  uniqueUserIds.forEach((userId) => {
    batch.delete(doc(db, collections.users, userId));
  });
  await batch.commit();
};

export const deleteApplicationsByIds = async (applicationIds) => {
  const uniqueApplicationIds = [...new Set(applicationIds)].filter(Boolean);
  if (uniqueApplicationIds.length === 0) {
    return;
  }

  if (uniqueApplicationIds.length === 1) {
    await deleteDoc(doc(db, collections.applications, uniqueApplicationIds[0]));
    return;
  }

  const batch = writeBatch(db);
  uniqueApplicationIds.forEach((applicationId) => {
    batch.delete(doc(db, collections.applications, applicationId));
  });
  await batch.commit();
};

export const uploadProfileImage = async (userId, profileImageFile) => {
  const updatedAt = new Date().toISOString();
  const fileExtension = getFileExtension(profileImageFile);
  const imageRef = ref(storage, `profile-images/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExtension}`);

  await uploadBytes(imageRef, profileImageFile, {
    contentType: profileImageFile.type || 'image/jpeg',
  });

  const url = await getDownloadURL(imageRef);
  return {
    url,
    path: imageRef.fullPath,
    updatedAt,
  };
};

export const seedDefaultRooms = async () => {
  const batch = writeBatch(db);
  DEFAULT_ROOM_INVENTORY.forEach((room) => {
    batch.set(doc(db, collections.rooms, room.id), room, { merge: true });
  });
  await batch.commit();
};

export const upsertRoom = async (room) => {
  await setDoc(doc(db, collections.rooms, room.id), room, { merge: true });
};
