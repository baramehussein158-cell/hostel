import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { db, storage } from '../../../lib/firebaseConfig';
import { DEFAULT_ROOM_INVENTORY, sortApplicationsByDate } from '../data/portalData';

const collections = {
  applications: 'applications',
  rooms: 'rooms',
  users: 'users',
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

export const updateUserProfileImage = async (userId, profileImageUrl) => {
  await updateDoc(doc(db, collections.users, userId), { profileImageUrl });
};

export const uploadProfileImage = async (userId, profileImageDataUrl) => {
  const imageRef = ref(storage, `profile-images/${userId}/avatar`);
  await uploadString(imageRef, profileImageDataUrl, 'data_url');
  return getDownloadURL(imageRef);
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
