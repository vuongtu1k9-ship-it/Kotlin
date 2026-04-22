import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createEmptyBoard } from '../state/initialBoard';
import { type Piece, type PieceSide, type PieceType } from '../types';
import { apiGet, apiPost, apiPut } from '../api';
import { logger } from '../utils/logger';
import { fenToBoard } from '../utils/fen';
import { isInCheck } from '../utils/moveLogic';
import { sanitizeText } from '../utils/sanitization';
import { makeSlug } from '../utils/slug';
import { PalettePick } from '../components/setup/PiecePalette';

const PIECE_LIMITS: Record<PieceType, number> = {
  general: 1, advisor: 2, elephant: 2, horse: 2, chariot: 2, cannon: 2, soldier: 5
};

const isInPalace = (row: number, col: number, side: PieceSide) => {
  if (col < 3 || col > 5) return false;
  if (side === 'red') return row >= 7;
  return row <= 2;
};

const getPlacementError = (type: PieceType, side: PieceSide, row: number, col: number, t: any): string | null => {
  const sideName = side === 'red' ? t('setup.validation.red') : t('setup.validation.black');
  if (type === 'general') {
    if (!isInPalace(row, col, side)) return t('setup.validation.generalPalace', { side: sideName });
  }
  if (type === 'advisor') {
    if (!isInPalace(row, col, side)) return t('setup.validation.advisorPalace', { side: sideName });
    const points = side === 'red' ? [[9, 3], [9, 5], [8, 4], [7, 3], [7, 5]] : [[0, 3], [0, 5], [1, 4], [2, 3], [2, 5]];
    if (!points.some(([r, c]) => r === row && c === col)) return t('setup.validation.advisorDiagonal', { side: sideName });
  }
  if (type === 'elephant') {
    const isOverRiver = side === 'red' ? row < 5 : row > 4;
    if (isOverRiver) return t('setup.validation.elephantRiver', { side: sideName });
    const points = side === 'red' ? [[9, 2], [9, 6], [7, 0], [7, 4], [7, 8], [5, 2], [5, 6]] : [[0, 2], [0, 6], [2, 0], [2, 4], [2, 8], [4, 2], [4, 6]];
    if (!points.some(([r, c]) => r === row && c === col)) return t('setup.validation.elephantPoints', { side: sideName });
  }
  if (type === 'soldier') {
    if (side === 'red') {
      if (row > 6) return t('setup.validation.redSoldierBackward');
      if (row >= 5 && col % 2 !== 0) return t('setup.validation.redSoldierColumns');
    } else {
      if (row < 3) return t('setup.validation.blackSoldierBackward');
      if (row <= 4 && col % 2 !== 0) return t('setup.validation.blackSoldierColumns');
    }
  }
  return null;
};

export function useSetupData(authState: any, toast: any) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [board, setBoard] = useState<(Piece | null)[][]>(() => createEmptyBoard());
  const [pick, setPick] = useState<PalettePick>({ side: 'red', type: 'general' });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('');
  const [saved, setSaved] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPlayingAi, setIsPlayingAi] = useState(false);
  const [aiEnabledInTryout, setAiEnabledInTryout] = useState(true);
  const [playSide, setPlaySide] = useState<PieceSide>('red');
  const [aiEngine, setAiEngine] = useState<'web' | 'pikafish'>('pikafish');
  const [aiBotId, setAiBotId] = useState<string | null>(null);
  const [aiLevel, setAiLevel] = useState<number>(5);
  const [duplicateInfo, setDuplicateInfo] = useState<{ uid: string; name: string } | null>(null);
  const [importFen, setImportFen] = useState('');
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; title: string; message: string; variant?: 'info' | 'danger' | 'warning' | 'success' }>({
    show: false, title: '', message: '', variant: 'info'
  });
  
  const idCounter = useRef<Record<string, number>>({});

  const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (type === 'error') toast.error(msg);
    else if (type === 'success') toast.success(msg);
    else toast.info(msg);
  };

  const isValidPlacement = (row: number, col: number): boolean => {
    if ('kind' in pick) return true;
    return getPlacementError(pick.type, pick.side, row, col, t) === null;
  };

  const placeAt = (row: number, col: number) => {
    if ('kind' in pick) {
      setBoard(prev => prev.map((r, ri) => ri === row ? r.map((c, ci) => ci === col ? null : c) : r));
      return;
    }

    const { type, side } = pick;
    let currentCount = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = board[r][c];
        if (p && p.side === side && p.type === type && (r !== row || c !== col)) currentCount++;
      }
    }
    
    const limit = PIECE_LIMITS[type];
    if (currentCount >= limit) { addLog(t('setup.validation.pieceLimit', { limit, type }), 'error'); return; }
    const err = getPlacementError(type, side, row, col, t);
    if (err) { addLog(err, 'error'); return; }

    const key = `${pick.side}-${pick.type}`;
    idCounter.current[key] = (idCounter.current[key] || 0) + 1;
    const piece: Piece = { id: `${key}-${idCounter.current[key]}`, side: pick.side, type: pick.type, position: { row, col }, hasMoved: true };
    setBoard(prev => prev.map((r, ri) => ri === row ? r.map((pieceVal, ci) => ci === col ? piece : pieceVal) : r));
  };

  const loadSetup = async (id: string) => {
    try {
      const j = await apiGet(`/setups/${encodeURIComponent(id)}`, authState.token);
      if (j?.ok) {
        setBoard(j.setup.board); setName(j.setup.name || ''); setDescription(j.setup.description || '');
        if (j.setup.level) setLevel(String(j.setup.level));
        setIsEditing(true); setEditId(id);
        addLog(t('setup.validation.successLoad', { name: j.setup.name }), 'success');
      }
    } catch (e) { logger.debug('loadSetup failed', e); }
  };

  const refreshSaved = async () => {
    try {
      const j = await apiGet(`/setups/mine?limit=50`, authState.token);
      if (j?.ok) setSaved(j.setups || []);
    } catch (e) { logger.debug('refreshSaved failed', e); }
  };

  const getValidationErrors = (includeMetadata: boolean) => {
    const errors: string[] = [];
    if (includeMetadata) {
      if (!authState.user || authState.user.provider === 'guest') errors.push(t('setup.validation.loginRequired'));
      if (!name.trim()) errors.push(t('setup.validation.nameRequired'));
      if (!description.trim()) errors.push(t('setup.validation.descRequired'));
    }

    let redKings = 0, blackKings = 0;
    let rkPos: any = null, bkPos: any = null;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = board[r][c];
        if (!p) continue;
        if (p.type === 'general') { 
          if (p.side === 'red') { redKings++; rkPos = { r, c }; }
          else { blackKings++; bkPos = { r, c }; }
        }
        const err = getPlacementError(p.type, p.side, r, c, t);
        if (err) errors.push(err);
      }
    }
    if (redKings !== 1 || blackKings !== 1) errors.push(t('setup.validation.twoKings'));

    if (rkPos && bkPos && rkPos.c === bkPos.c) {
      let blocked = false;
      const minR = Math.min(rkPos.r, bkPos.r);
      const maxR = Math.max(rkPos.r, bkPos.r);
      for (let r = minR + 1; r < maxR; r++) { if (board[r][rkPos.c]) { blocked = true; break; } }
      if (!blocked) errors.push(t('setup.validation.faceToFace'));
    }

    if (isInCheck('red', board)) errors.push(t('setup.validation.redCheck'));
    if (isInCheck('black', board)) errors.push(t('setup.validation.blackCheck'));

    return errors;
  };

  const saveSetup = async () => {
    const sName = sanitizeText(name);
    const sDesc = sanitizeText(description);
    setName(sName); setDescription(sDesc);

    const errors = getValidationErrors(true);
    if (errors.length > 0) {
      setShowValidationErrors(true);
      setAlertInfo({ show: true, title: t('setup.validation.checkAgain'), message: errors.join('\n'), variant: 'danger' });
      return;
    }
    setShowValidationErrors(false);

    try {
      const endpoint = isEditing ? `/setups/${editId}` : `/setups`;
      const body = { name: sName, description: sDesc, level: level ? Number(level) : null, board };
      const res = isEditing ? await apiPut(endpoint, body, authState.token) : await apiPost(endpoint, body, authState.token);
      if (res?.ok) {
        addLog(isEditing ? t('setup.validation.successUpdate', { name: sName }) : t('setup.validation.successSave', { name: sName }), 'success');
        if (!isEditing) nav(`/puzzles/${makeSlug(sName, res.uid || res.setupId)}`);
        else refreshSaved();
      } else if (res?.error === 'DUPLICATE_PUZZLE' && res.uid) {
        setDuplicateInfo({ uid: res.uid, name: res.name || res.uid });
      } else {
        setAlertInfo({ show: true, title: t('setup.validation.saveError'), message: res?.error || t('setup.validation.unknownError'), variant: 'danger' });
      }
    } catch (e: any) { setAlertInfo({ show: true, title: t('setup.validation.connError'), message: e.message || t('setup.validation.connMsg'), variant: 'danger' }); }
  };

  const handleTryAi = () => {
    const errors = getValidationErrors(false);
    if (errors.length > 0) {
      setAlertInfo({ show: true, title: t('setup.validation.title'), message: errors.join('\n'), variant: 'warning' });
      return;
    }
    setIsPlayingAi(true);
  };

  const doImportFen = () => {
    try {
      const { board: newBoard, sideToMove } = fenToBoard(importFen);
      setBoard(newBoard); setPlaySide(sideToMove); setImportFen('');
      addLog(t('setup.validation.successImportFen'), 'success');
      return true;
    } catch (e) { addLog(t('setup.validation.fenError'), 'error'); return false; }
  };

  useEffect(() => { if (authState.token) refreshSaved(); }, [authState.token]);
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) void loadSetup(id);
  }, [searchParams]);

  return {
    board, setBoard, pick, setPick, name, setName, description, setDescription, level, setLevel,
    saved, isEditing, setIsEditing, isPlayingAi, setIsPlayingAi, aiEnabledInTryout, setAiEnabledInTryout,
    playSide, setPlaySide, aiEngine, setAiEngine, aiBotId, setAiBotId, aiLevel, setAiLevel, duplicateInfo, setDuplicateInfo,
    importFen, setImportFen, showValidationErrors, setShowValidationErrors, alertInfo, setAlertInfo,
    placeAt, isValidPlacement, saveSetup, handleTryAi, doImportFen, refreshSaved, loadSetup
  };
}
