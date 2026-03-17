import { User } from '../types/game';
import { sendMessage } from '../services/chatService';
import { getUser, updateUser, addXp, calculateRequiredXp } from '../services/userService';
import { getRandomMission, MISSIONS } from '../data/missions';
import { pullGacha, GACHA_COST } from '../data/gacha';
import { getClassById, CLASSES } from '../data/classes';
import { createBattle, acceptBattle, declineBattle } from '../services/pvpService';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export async function parseCommand(cmd: string, user: User, pendingBattles: any[]) {
  const parts = cmd.trim().split(' ');
  const command = parts[0].toLowerCase();

  switch (command) {
    case '/perfil': {
      const cls = getClassById(user.currentClassId);
      const reqXp = calculateRequiredXp(user.level);
      const msg = `[PERFIL] ${user.displayName} | Nível: ${user.level} | XP: ${user.xp}/${reqXp} | Classe: ${cls.name} (${cls.rarity}) | CriptoBlue: ${user.criptoBlue} | Vitórias PvP: ${user.pvpWins} | Derrotas PvP: ${user.pvpLosses}`;
      await sendMessage(msg, user.uid, 'Sistema', 'system');
      break;
    }
    case '/classe': {
      const cls = getClassById(user.currentClassId);
      const msg = `[CLASSE] ${cls.name} (${cls.rarity}): ${cls.description} | HP: ${cls.baseStats.hp} | ATK: ${cls.baseStats.attack} | DEF: ${cls.baseStats.defense} | SPD: ${cls.baseStats.speed}`;
      await sendMessage(msg, user.uid, 'Sistema', 'system');
      break;
    }
    case '/classes': {
      const classesStr = user.unlockedClasses.map(id => getClassById(id).name).join(', ');
      const msg = `[CLASSES DESBLOQUEADAS] ${classesStr}`;
      await sendMessage(msg, user.uid, 'Sistema', 'system');
      break;
    }
    case '/missao': {
      if (user.activeMission) {
        const now = new Date();
        const endTime = new Date(user.activeMission.endTime);
        if (now < endTime) {
          const remaining = Math.ceil((endTime.getTime() - now.getTime()) / 1000);
          await sendMessage(`[MISSÃO] Você já está em uma missão! Faltam ${remaining} segundos.`, user.uid, 'Sistema', 'system');
          return;
        }
        
        const mission = MISSIONS.find(m => m.id === user.activeMission?.missionId);
        if (!mission) {
          await updateUser(user.uid, { activeMission: null });
          return;
        }
        
        // Use class stats to influence success? Let's keep it simple for now but add a chance to lose
        // Higher level missions have lower success rate if you are just at the level req
        const levelDiff = user.level - mission.levelReq;
        const baseSuccessChance = 0.7; // 70%
        const successChance = Math.min(0.95, baseSuccessChance + (levelDiff * 0.05));
        
        const success = Math.random() < successChance;
        
        // Clear active mission first to prevent double claiming
        await updateUser(user.uid, { activeMission: null });

        if (success) {
          const leveledUp = await addXp(user.uid, mission.xpReward, user);
          await updateUser(user.uid, {
            criptoBlue: user.criptoBlue + mission.criptoBlueReward,
            missionsCompleted: user.missionsCompleted + 1
          });
          let msg = `[MISSÃO CONCLUÍDA] 🏆 Você completou "${mission.name}" com sucesso! +${mission.xpReward} XP | +${mission.criptoBlueReward} CB`;
          if (leveledUp) msg += `\n✨ NÍVEL AUMENTADO! Você agora é nível ${user.level + 1}!`;
          await sendMessage(msg, user.uid, 'Sistema', 'system');
        } else {
          // Add a small penalty or just no reward
          const penalty = Math.floor(Math.random() * 5); // Lose 0-4 CriptoBlue on failure? 
          const newCripto = Math.max(0, user.criptoBlue - penalty);
          await updateUser(user.uid, { criptoBlue: newCripto });
          
          await sendMessage(`[MISSÃO FRACASSADA] ❌ Você foi derrotado em "${mission.name}". Seus ferimentos foram tratados, mas você perdeu ${penalty} CriptoBlue em suprimentos médicos.`, user.uid, 'Sistema', 'combat');
        }
      } else {
        const mission = getRandomMission(user.level);
        const startTime = new Date().toISOString();
        const endTime = new Date(Date.now() + mission.durationSeconds * 1000).toISOString();
        
        await updateUser(user.uid, {
          activeMission: {
            missionId: mission.id,
            startTime,
            endTime
          }
        });
        await sendMessage(`[MISSÃO INICIADA] Você partiu para "${mission.name}". Tempo estimado: ${mission.timeEstimate}.`, user.uid, 'Sistema', 'system');
      }
      break;
    }
    case '/gacha': {
      if (user.criptoBlue < GACHA_COST) {
        await sendMessage(`[GACHA] CriptoBlue insuficiente. Custa ${GACHA_COST}. Você tem ${user.criptoBlue}.`, user.uid, 'Sistema', 'system');
        return;
      }
      const newClassId = pullGacha();
      const cls = getClassById(newClassId);
      
      const updates: Partial<User> = { criptoBlue: user.criptoBlue - GACHA_COST };
      let msg = `[GACHA] Você invocou: ${cls.name} (${cls.rarity})!`;
      
      if (!user.unlockedClasses.includes(newClassId)) {
        updates.unlockedClasses = [...user.unlockedClasses, newClassId];
        msg += ` Nova classe desbloqueada!`;
      } else {
        msg += ` Você já possui esta classe. Convertido em 50 CriptoBlue.`;
        updates.criptoBlue = updates.criptoBlue! + 50;
      }
      
      await updateUser(user.uid, updates);
      await sendMessage(msg, user.uid, 'Sistema', 'gacha');
      break;
    }
    case '/equipar': {
      const className = parts.slice(1).join(' ').toLowerCase();
      if (!className) {
        await sendMessage(`[SISTEMA] Uso correto: /equipar [nome da classe]`, user.uid, 'Sistema', 'system');
        return;
      }
      const cls = CLASSES.find(c => c.name.toLowerCase().includes(className));
      if (!cls) {
        await sendMessage(`[SISTEMA] Classe não encontrada.`, user.uid, 'Sistema', 'system');
        return;
      }
      if (!user.unlockedClasses.includes(cls.id)) {
        await sendMessage(`[SISTEMA] Você não possui a classe ${cls.name}.`, user.uid, 'Sistema', 'system');
        return;
      }
      await updateUser(user.uid, { currentClassId: cls.id });
      await sendMessage(`[SISTEMA] Você equipou a classe ${cls.name}.`, user.uid, 'Sistema', 'system');
      break;
    }
    case '/pvp': {
      const targetName = parts.slice(1).join(' ');
      if (!targetName) {
        await sendMessage(`[SISTEMA] Use /pvp [NomeDoJogador] para desafiar alguém.`, user.uid, 'Sistema', 'system');
        return;
      }
      const q = query(collection(db, 'users'), where('displayName', '==', targetName));
      const snap = await getDocs(q);
      if (snap.empty) {
        await sendMessage(`[SISTEMA] Jogador ${targetName} não encontrado.`, user.uid, 'Sistema', 'system');
        return;
      }
      const targetUser = snap.docs[0].data() as User;
      if (targetUser.uid === user.uid) {
        await sendMessage(`[SISTEMA] Você não pode desafiar a si mesmo.`, user.uid, 'Sistema', 'system');
        return;
      }
      if (!targetUser.isOnline) {
        await sendMessage(`[SISTEMA] O jogador ${targetName} está offline.`, user.uid, 'Sistema', 'system');
        return;
      }
      await createBattle(user, targetUser);
      await sendMessage(`[PVP] Convite de batalha enviado para ${targetName}.`, user.uid, 'Sistema', 'combat');
      break;
    }
    case '/aceitar': {
      if (pendingBattles.length === 0) {
        await sendMessage(`[SISTEMA] Nenhum convite de batalha pendente.`, user.uid, 'Sistema', 'system');
        return;
      }
      const battle = pendingBattles[0];
      const challenger = await getUser(battle.challengerUid);
      if (challenger) {
        const winnerUid = await acceptBattle(battle.id, challenger, user);
        let msg = `[PVP] Batalha finalizada entre ${challenger.displayName} e ${user.displayName}! Vencedor: `;
        if (winnerUid === challenger.uid) {
          msg += challenger.displayName;
          await updateUser(challenger.uid, { pvpWins: challenger.pvpWins + 1, criptoBlue: challenger.criptoBlue + 50 });
          await updateUser(user.uid, { pvpLosses: user.pvpLosses + 1 });
        } else if (winnerUid === user.uid) {
          msg += user.displayName;
          await updateUser(user.uid, { pvpWins: user.pvpWins + 1, criptoBlue: user.criptoBlue + 50 });
          await updateUser(challenger.uid, { pvpLosses: challenger.pvpLosses + 1 });
        } else {
          msg += 'Empate';
        }
        await sendMessage(msg, user.uid, 'Sistema', 'combat');
      }
      break;
    }
    case '/recusar': {
      if (pendingBattles.length === 0) {
        await sendMessage(`[SISTEMA] Nenhum convite de batalha pendente.`, user.uid, 'Sistema', 'system');
        return;
      }
      const battle = pendingBattles[0];
      await declineBattle(battle.id);
      await sendMessage(`[PVP] Você recusou a batalha de ${battle.challengerName}.`, user.uid, 'Sistema', 'system');
      break;
    }
    case '/daily': {
      const today = new Date().toISOString().split('T')[0];
      if (user.lastDaily === today) {
        await sendMessage(`[SISTEMA] Você já resgatou sua recompensa diária hoje.`, user.uid, 'Sistema', 'system');
        return;
      }
      const newStreak = user.dailyStreak + 1;
      const reward = 50 + (newStreak * 10);
      await updateUser(user.uid, {
        criptoBlue: user.criptoBlue + reward,
        lastDaily: today,
        dailyStreak: newStreak
      });
      await sendMessage(`[DAILY] Você resgatou sua recompensa diária! +${reward} CriptoBlue. Sequência: ${newStreak} dias.`, user.uid, 'Sistema', 'system');
      break;
    }
    case '/ranking': {
      const q = query(collection(db, 'users'), orderBy('level', 'desc'), limit(5));
      const snap = await getDocs(q);
      let msg = `[RANKING GLOBAL]\n`;
      snap.docs.forEach((doc, i) => {
        const u = doc.data() as User;
        msg += `${i + 1}º - ${u.displayName} (Lv.${u.level})\n`;
      });
      await sendMessage(msg, user.uid, 'Sistema', 'system');
      break;
    }
    case '/loja': {
      const msg = `[LOJA] Bem-vindo! Use /gacha para invocar novas classes por ${GACHA_COST} CriptoBlue. Mais itens em breve!`;
      await sendMessage(msg, user.uid, 'Sistema', 'system');
      break;
    }
    case '/inventario': {
      const items = user.inventory.length > 0 ? user.inventory.join(', ') : 'Vazio';
      const msg = `[INVENTÁRIO] ${items}`;
      await sendMessage(msg, user.uid, 'Sistema', 'system');
      break;
    }
    case '/habilidades': {
      const cls = getClassById(user.currentClassId);
      const skillsStr = cls.skills.map(s => `${s.name} (Dano: ${s.damageMultiplier}x)`).join(' | ');
      const msg = `[HABILIDADES] Classe ${cls.name}: ${skillsStr}`;
      await sendMessage(msg, user.uid, 'Sistema', 'system');
      break;
    }
    case '/nome': {
      const newName = parts.slice(1).join(' ').trim();
      if (!newName) {
        await sendMessage(`[SISTEMA] Uso correto: /nome [novo_nome]`, user.uid, 'Sistema', 'system');
        return;
      }
      if (newName.length > 20) {
        await sendMessage(`[SISTEMA] O nome deve ter no máximo 20 caracteres.`, user.uid, 'Sistema', 'system');
        return;
      }
      
      try {
        await updateUser(user.uid, { displayName: newName });
        await sendMessage(`[SISTEMA] ✅ Seu nome foi alterado para "${newName}" com sucesso!`, user.uid, 'Sistema', 'system');
      } catch (error) {
        await sendMessage(`[SISTEMA] ❌ Erro ao alterar nome. Tente novamente.`, user.uid, 'Sistema', 'system');
      }
      break;
    }
    case '/ajuda': {
      const msg = `[AJUDA] Comandos disponíveis: /perfil, /nome [novo_nome], /classe, /classes, /equipar [nome], /missao, /gacha, /pvp [nome], /aceitar, /recusar, /daily, /ranking, /loja, /inventario, /habilidades, /ajuda`;
      await sendMessage(msg, user.uid, 'Sistema', 'system');
      break;
    }
    default: {
      await sendMessage(cmd, user.uid, user.displayName, 'user');
      break;
    }
  }
}
