import { collection, addDoc, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { PvPBattle, User } from '../types/game';
import { CLASSES } from '../data/classes';

export async function createBattle(challenger: User, defender: User) {
  const battle: PvPBattle = {
    challengerUid: challenger.uid,
    challengerName: challenger.displayName,
    defenderUid: defender.uid,
    defenderName: defender.displayName,
    status: 'pending',
    winnerUid: '',
    log: [],
    createdAt: new Date().toISOString()
  };
  const docRef = await addDoc(collection(db, 'pvp_battles'), battle);
  return docRef.id;
}

export async function acceptBattle(battleId: string, challenger: User, defender: User) {
  const log: string[] = [];
  log.push(`Batalha iniciada: ${challenger.displayName} vs ${defender.displayName}`);

  let cHp = challenger.stats.hp + (CLASSES.find(c => c.id === challenger.currentClassId)?.baseStats.hp || 0);
  let dHp = defender.stats.hp + (CLASSES.find(c => c.id === defender.currentClassId)?.baseStats.hp || 0);
  
  const cAtk = challenger.stats.attack + (CLASSES.find(c => c.id === challenger.currentClassId)?.baseStats.attack || 0);
  const dAtk = defender.stats.attack + (CLASSES.find(c => c.id === defender.currentClassId)?.baseStats.attack || 0);

  let turn = 1;
  while (cHp > 0 && dHp > 0 && turn < 20) {
    if (turn % 2 !== 0) {
      const dmg = Math.max(1, cAtk - Math.floor(Math.random() * 10));
      dHp -= dmg;
      log.push(`${challenger.displayName} atacou causando ${dmg} de dano!`);
    } else {
      const dmg = Math.max(1, dAtk - Math.floor(Math.random() * 10));
      cHp -= dmg;
      log.push(`${defender.displayName} atacou causando ${dmg} de dano!`);
    }
    turn++;
  }

  let winnerUid = '';
  if (cHp > 0 && dHp <= 0) {
    winnerUid = challenger.uid;
    log.push(`${challenger.displayName} venceu a batalha!`);
  } else if (dHp > 0 && cHp <= 0) {
    winnerUid = defender.uid;
    log.push(`${defender.displayName} venceu a batalha!`);
  } else {
    log.push(`Empate!`);
  }

  await updateDoc(doc(db, 'pvp_battles', battleId), {
    status: 'finished',
    winnerUid,
    log
  });

  return winnerUid;
}

export async function declineBattle(battleId: string) {
  await updateDoc(doc(db, 'pvp_battles', battleId), {
    status: 'declined'
  });
}

export function listenToPendingBattles(uid: string, callback: (battles: PvPBattle[]) => void) {
  const q = query(collection(db, 'pvp_battles'), where('defenderUid', '==', uid), where('status', '==', 'pending'));
  return onSnapshot(q, (snapshot) => {
    const battles: PvPBattle[] = [];
    snapshot.forEach((doc) => battles.push({ id: doc.id, ...doc.data() } as PvPBattle));
    callback(battles);
  });
}
