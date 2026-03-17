import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Message } from '../types/game';

export function listenToMessages(callback: (messages: Message[]) => void) {
  const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const msgs: Message[] = [];
    snapshot.forEach((doc) => {
      msgs.push({ id: doc.id, ...doc.data() } as Message);
    });
    callback(msgs.reverse());
  });
}

export async function sendMessage(text: string, authorUid: string, authorName: string, type: Message['type'] = 'user') {
  const msg: Message = {
    text,
    authorUid,
    authorName,
    type,
    timestamp: new Date().toISOString()
  };
  await addDoc(collection(db, 'messages'), msg);
}
