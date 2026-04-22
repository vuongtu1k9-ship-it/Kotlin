import { useState } from 'react';
import { API_URL } from '../auth/auth';
import type { TournamentPrize } from '../pages/TournamentsPage';

export function useTournamentForm(authState: any, onSuccess: () => void) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tName, setTName] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tStartDate, setTStartDate] = useState('');
  const [tEndDate, setTEndDate] = useState('');
  const [tDeadline, setTDeadline] = useState('');
  const [tMaxPlayers, setTMaxPlayers] = useState('');
  const [tMinElo, setTMinElo] = useState('');
  const [tMaxElo, setTMaxElo] = useState('');
  const [tTimeControl, setTTimeControl] = useState('standard');
  const [tFormat, setTFormat] = useState('swiss');
  const [tMaxRounds, setTMaxRounds] = useState('');
  const [tRequireApproval, setTRequireApproval] = useState(false);
  const [tPrizes, setTPrizes] = useState<TournamentPrize[]>([
    { rank: 1, title: 'Vô Địch', description: '', coins: 0, items: [] },
    { rank: 2, title: 'Á Quân', description: '', coins: 0, items: [] },
    { rank: 3, title: 'Hạng Ba', description: '', coins: 0, items: [] },
  ]);

  const updatePrize = (idx: number, field: keyof TournamentPrize, val: any) => {
    setTPrizes(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };
  const addPrize = () => setTPrizes(prev => [...prev, { rank: prev.length + 1, title: `Hạng ${prev.length + 1}`, description: '', coins: 0, items: [] }]);
  const removePrize = (idx: number) => setTPrizes(prev => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setEditId(null);
    setIsEditing(false);
    setTName(''); setTDesc(''); setTStartDate(''); setTEndDate(''); setTDeadline('');
    setTMaxPlayers(''); setTMinElo(''); setTMaxElo(''); setTTimeControl('standard');
    setTFormat('swiss'); setTMaxRounds(''); setTRequireApproval(false);
    setTPrizes([
      { rank: 1, title: 'Vô Địch', description: '', coins: 0, items: [] },
      { rank: 2, title: 'Á Quân', description: '', coins: 0, items: [] },
      { rank: 3, title: 'Hạng Ba', description: '', coins: 0, items: [] },
    ]);
  };

  const handleEdit = (t: any) => {
    setEditId(t._id);
    setIsEditing(true);
    setTName(t.name || '');
    setTDesc(t.description || '');
    setTStartDate(t.startDate ? t.startDate.slice(0, 10) : '');
    setTEndDate(t.endDate ? t.endDate.slice(0, 10) : '');
    setTDeadline(t.registrationDeadline ? t.registrationDeadline.slice(0, 16) : '');
    setTMaxPlayers(t.maxPlayers?.toString() || '');
    setTMinElo(t.minElo?.toString() || '');
    setTMaxElo(t.maxElo?.toString() || '');
    setTTimeControl(t.timeControl || 'standard');
    setTFormat(t.format || 'swiss');
    setTMaxRounds(t.maxRounds?.toString() || '');
    setTRequireApproval(!!t.requireApproval);
    setTPrizes(t.prizes?.length > 0 ? t.prizes.map((p: any) => ({
      ...p,
      coins: p.coins || 0,
      items: p.items || []
    })) : [
      { rank: 1, title: 'Vô Địch', description: '', coins: 0, items: [] },
      { rank: 2, title: 'Á Quân', description: '', coins: 0, items: [] },
      { rank: 3, title: 'Hạng Ba', description: '', coins: 0, items: [] },
    ]);
    setShowCreate(true);
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const prizes = tPrizes.filter(p => (p.coins && p.coins > 0) || (p.items && p.items.length > 0) || (p.description && p.description.trim()));
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `${API_URL}/admin/tournaments/${editId}` : `${API_URL}/admin/tournaments`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;

      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: tName, description: tDesc,
          startDate: tStartDate || null, endDate: tEndDate || null,
          registrationDeadline: tDeadline || null,
          maxPlayers: tMaxPlayers ? Number(tMaxPlayers) : null,
          minElo: tMinElo ? Number(tMinElo) : null,
          maxElo: tMaxElo ? Number(tMaxElo) : null,
          timeControl: tTimeControl, format: tFormat,
          maxRounds: tMaxRounds ? Number(tMaxRounds) : null,
          requireApproval: tRequireApproval,
          prizes: prizes.length > 0 ? prizes : [],
        }),
      });
      if ((await res.json()).ok) {
        setShowCreate(false);
        onSuccess();
        resetForm();
      }
    } finally { setCreating(false); }
  };

  return {
    showCreate, setShowCreate, creating, isEditing, resetForm, handleEdit,
    tName, setTName, tDesc, setTDesc,
    tStartDate, setTStartDate, tEndDate, setTEndDate,
    tDeadline, setTDeadline, tMaxPlayers, setTMaxPlayers,
    tMinElo, setTMinElo, tMaxElo, setTMaxElo,
    tTimeControl, setTTimeControl, tFormat, setTFormat,
    tMaxRounds, setTMaxRounds, tRequireApproval, setTRequireApproval,
    tPrizes, updatePrize, addPrize, removePrize,
    handleCreateTournament
  };
}
