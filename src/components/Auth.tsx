import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { getUser, createUser } from '../services/userService';
import { motion } from 'motion/react';
import { Swords } from 'lucide-react';

export default function Auth({ onLogin }: { onLogin: (uid: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      let gameUser = await getUser(user.uid);
      if (!gameUser) {
        gameUser = await createUser(user.uid, user.displayName || 'Caçador', user.photoURL || '', user.email || '');
      }
      onLogin(user.uid);
    } catch (error) {
      console.error("Login error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-blue-100 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
          <Swords className="w-12 h-12 text-blue-400" />
        </div>
        
        <h1 className="text-5xl font-black mb-2 tracking-tighter bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
          HUNTER BLUE
        </h1>
        <p className="text-blue-300/60 mb-12 text-center max-w-sm font-mono text-sm">
          O MMORPG de chat definitivo. Desbloqueie classes, complete missões e domine o ranking.
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] disabled:opacity-50"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          <span className="relative flex items-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? 'Conectando...' : 'Entrar com Google'}
          </span>
        </button>
      </motion.div>
    </div>
  );
}
