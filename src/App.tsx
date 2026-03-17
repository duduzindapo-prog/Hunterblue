/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import GameInterface from './components/GameInterface';

export default function App() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-blue-400 font-mono">Iniciando Hunter Blue...</div>;
  }

  return (
    <>
      {uid ? <GameInterface uid={uid} /> : <Auth onLogin={setUid} />}
    </>
  );
}

