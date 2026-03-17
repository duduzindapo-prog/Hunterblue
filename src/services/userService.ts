import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { User, UserStats } from '../types/game';
import { CLASSES } from '../data/classes';

export const INITIAL_STATS: UserStats = {
  hp: 100,
  attack: 10,
  defense: 10,
  speed: 10
};

export async function getUser(uid: string): Promise<User | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as User;
  }
  return null;
}

export async function createUser(uid: string, displayName: string, photoURL: string, email: string) {
  const newUser: User = {
    uid,
    displayName,
    photoURL,
    email,
    level: 1,
    xp: 0,
    criptoBlue: 100,
    currentClassId: 'c_iniciante',
    unlockedClasses: ['c_iniciante'],
    stats: INITIAL_STATS,
    inventory: [],
    pvpWins: 0,
    pvpLosses: 0,
    missionsCompleted: 0,
    isOnline: true,
    lastLogin: new Date().toISOString(),
    lastDaily: '',
    dailyStreak: 0
  };
  await setDoc(doc(db, 'users', uid), newUser);
  return newUser;
}

export async function updateUser(uid: string, data: Partial<User>) {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, data);
}

export function listenToUser(uid: string, callback: (user: User | null) => void) {
  return onSnapshot(doc(db, 'users', uid), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as User);
    } else {
      callback(null);
    }
  });
}

export function listenToAllUsers(callback: (users: User[]) => void) {
  const q = query(collection(db, 'users'), orderBy('level', 'desc'), limit(100));
  return onSnapshot(q, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach((doc) => users.push(doc.data() as User));
    callback(users);
  });
}

export function calculateRequiredXp(level: number) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export async function addXp(uid: string, amount: number, currentUser: User) {
  let { xp, level, stats } = currentUser;
  xp += amount;
  let requiredXp = calculateRequiredXp(level);
  let leveledUp = false;

  while (xp >= requiredXp) {
    xp -= requiredXp;
    level++;
    leveledUp = true;
    stats.hp += 20;
    stats.attack += 5;
    stats.defense += 5;
    stats.speed += 2;
    requiredXp = calculateRequiredXp(level);
  }

  await updateUser(uid, { xp, level, stats });
  return leveledUp;
}
