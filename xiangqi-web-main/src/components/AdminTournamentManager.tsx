import React from 'react';
import { logger } from '../utils/logger';
import { Editor } from '@tinymce/tinymce-react';
import { API_URL } from '../auth/auth';
import type { TournamentPrize } from '../pages/TournamentsPage';
import { TIME_CONTROL_CONFIG } from '../constants/tournamentConstants';

interface AdminTournament {
  _id: string;
  name: string;
  description: string;
  status: 'registration' | 'active' | 'finished' | 'deadline_closed';
  players: string[];
  pendingPlayers?: string[];
  currentRound: number;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  maxPlayers?: number;
  minElo?: number;
  maxElo?: number;
  timeControl?: string;
  format?: string;
  maxRounds?: number;
  requireApproval?: boolean;
  prizes?: TournamentPrize[];
  champion?: { uid: string; name: string; points: number } | null;
  createdAt: number;
}

interface AdminTournamentManagerProps {
  tournaments: AdminTournament[];
  totalCount: number;
  showCreate: boolean;
  setShowCreate: (show: boolean) => void;
  creating: boolean;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string, name: string) => void;
  onCreate: (e: React.FormEvent) => void;
  formState: any;
  formHandlers: any;
  paginationUI: React.ReactNode;
}

export const AdminTournamentManager: React.FC<AdminTournamentManagerProps> = ({
  tournaments,
  totalCount,
  showCreate,
  setShowCreate,
  creating,
  onStatusChange,
  onDelete,
  onCreate,
  formState,
  formHandlers,
  paginationUI
}) => {
  const [shopItems, setShopItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch(`${API_URL}/gifts/list`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.ok) setShopItems(Object.values(data.gifts || {}));
      })
      .catch(err => logger.error('Fetch shop items failed', err));
  }, []);

  const input = 'w-full bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:border-white/30 outline-none';
  const labelStyle = 'block text-xs font-bold text-slate-600 dark:text-white/50 mb-1 uppercase tracking-wider';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quản Lý Giải Đấu ({totalCount})</h2>
        <button
          onClick={() => {
            if (showCreate) formHandlers.resetForm();
            else setShowCreate(true);
          }}
          className="bg-gradient-to-r from-xq-gold to-yellow-500 text-black px-5 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          {showCreate ? '✕ Đóng' : '+ Tổ Chức Giải Mới'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="font-black text-slate-900 dark:text-white text-lg mb-6">
            {formState.isEditing ? '✏️ Cập Nhật Giải Đấu' : '🏆 Tạo Giải Đấu Mới'}
          </h3>
          <form onSubmit={onCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Tên giải đấu *</label>
                <input
                  type="text"
                  value={formState.tName}
                  onChange={e => formHandlers.setTName(e.target.value)}
                  required
                  className={input}
                  placeholder="VD: Giải Vô Địch Mùa Xuân 2026"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>Mô tả chi tiết & Điều lệ (Hỗ trợ ảnh, bảng, media)</label>
                <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                  <Editor
                    tinymceScriptSrc="/libs/tinymce/tinymce.min.js"
                    apiKey="no-api-key"
                    licenseKey="gpl"
                    value={formState.tDesc}
                    onEditorChange={(content: string) => formHandlers.setTDesc(content)}
                    init={{
                      height: 350,
                      menubar: false,
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                      ],
                      toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | border | bullist numlist outdent indent | ' +
                        'table image media insertboard | removeformat | help',
                      content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px; background-color: #0c111d; color: #fff; }',
                      skin: 'oxide-dark',
                      content_css: 'dark',
                      branding: false,
                      promotion: false,
                      setup: (editor) => {
                        editor.ui.registry.addButton('insertboard', {
                          icon: 'table',
                          tooltip: 'Thiết kế bàn cờ trực quan',
                          onAction: () => {
                            if ((window as any).openVisualBoardEditor) {
                              (window as any).openVisualBoardEditor((data: { fen: string, moves: string }) => {
                                editor.insertContent(`[board fen="${data.fen}" moves="${data.moves}" title="Thế cờ mới" size="md"]`);
                              });
                            } else {
                              editor.insertContent('[board fen="rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w" moves="" title="Thế cờ mới" size="md"]');
                            }
                          }
                        });
                      },
                      relative_urls: false,
                      remove_script_host: false,
                      convert_urls: true,
                      images_upload_url: `${API_URL}/upload`,
                      automatic_uploads: true,
                      file_picker_types: 'image media',
                      file_picker_callback: (cb: any, _value: any, meta: any) => {
                        const input = document.createElement('input');
                        input.setAttribute('type', 'file');
                        input.setAttribute('accept', meta.filetype === 'image' ? 'image/*' : 'video/*');

                        input.onchange = function () {
                          const file = (this as any).files[0];
                          if (!file) return;
                          
                          const formData = new FormData();
                          formData.append('file', file);

                          fetch(`${API_URL}/upload`, {
                            method: 'POST',
                            body: formData,
                            credentials: 'include'
                          })
                          .then(res => res.json())
                          .then(json => {
                            if (json.location) {
                              cb(json.location, { title: file.name });
                            }
                          })
                          .catch(err => logger.error('Upload failed', err));
                        };

                        input.click();
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelStyle}>📅 Ngày bắt đầu</label>
                <input
                  type="date"
                  value={formState.tStartDate}
                  onChange={e => formHandlers.setTStartDate(e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label className={labelStyle}>🏁 Ngày kết thúc</label>
                <input
                  type="date"
                  value={formState.tEndDate}
                  onChange={e => formHandlers.setTEndDate(e.target.value)}
                  className={input}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>⏰ Hạn chót ghi danh</label>
                <input
                  type="datetime-local"
                  value={formState.tDeadline}
                  onChange={e => formHandlers.setTDeadline(e.target.value)}
                  className={input}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelStyle}>👥 Tối đa kỳ thủ</label>
                <input
                  type="number"
                  value={formState.tMaxPlayers}
                  onChange={e => formHandlers.setTMaxPlayers(e.target.value)}
                  className={input}
                  placeholder="Không giới hạn"
                  min="2"
                />
              </div>
              <div>
                <label className={labelStyle}>⬆️ ELO tối thiểu</label>
                <input
                  type="number"
                  value={formState.tMinElo}
                  onChange={e => formHandlers.setTMinElo(e.target.value)}
                  className={input}
                  placeholder="Không yêu cầu"
                  min="0"
                />
              </div>
              <div>
                <label className={labelStyle}>⬇️ ELO tối đa</label>
                <input
                  type="number"
                  value={formState.tMaxElo}
                  onChange={e => formHandlers.setTMaxElo(e.target.value)}
                  className={input}
                  placeholder="Không giới hạn"
                  min="0"
                />
              </div>
              <div>
                <label className={labelStyle}>🔒 Duyệt đơn</label>
                <button
                  type="button"
                  onClick={() => formHandlers.setTRequireApproval(!formState.tRequireApproval)}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    formState.tRequireApproval
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                      : 'bg-slate-100 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-600 dark:text-white/50'
                  }`}
                >
                  {formState.tRequireApproval ? '✅ Bật (Admin duyệt)' : '❌ Tắt (Tự do)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={labelStyle}>⏱ Thời gian cờ</label>
                  <select
                    value={formState.tTimeControl}
                    onChange={e => formHandlers.setTTimeControl(e.target.value)}
                    className={input}
                  >
                    {Object.entries(TIME_CONTROL_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.icon} {val.label} ({val.display})</option>
                    ))}
                  </select>
              </div>
              <div>
                <label className={labelStyle}>🏆 Thể thức</label>
                <select
                  value={formState.tFormat}
                  onChange={e => formHandlers.setTFormat(e.target.value)}
                  className={input}
                >
                  <option value="swiss">🔄 Thụy Sĩ (Swiss)</option>
                  <option value="roundrobin">🔁 Vòng Tròn (Round Robin)</option>
                  <option value="single_elimination">⚔️ Loại Trực Tiếp (Single)</option>
                  <option value="double_elimination">🛡️ Loại Trực Tiếp (Double)</option>
                  <option value="arena">🏟️ Đấu Trường (Arena)</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>🔢 Số vòng tối đa</label>
                <input
                  type="number"
                  value={formState.tMaxRounds}
                  onChange={e => formHandlers.setTMaxRounds(e.target.value)}
                  className={input}
                  placeholder="Không giới hạn"
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <div>
                  <label className={labelStyle}>🎁 Cơ cấu giải thưởng</label>
                  <p className="text-[10px] text-slate-500 dark:text-white/30 lowercase">Thiết lập phần thưởng cho các thứ hạng</p>
                </div>
                <button
                  type="button"
                  onClick={formHandlers.addPrize}
                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  + Thêm hạng mới
                </button>
              </div>
              
              <div className="space-y-3">
                {formState.tPrizes.map((prize: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-black/10 dark:border-white/10 hover:border-xq-gold/20 transition-all">
                    {/* Row header: rank + delete */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-slate-400 dark:text-white/40 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-base">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                        Hạng {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => formHandlers.removePrize(idx)}
                        className="text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-red-500/10"
                        title="Xóa hạng này"
                      >
                        ✕ Xóa
                      </button>
                    </div>

                    {/* Fields grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Title */}
                      <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Tên hạng</label>
                        <input
                          value={prize.title}
                          onChange={e => formHandlers.updatePrize(idx, 'title', e.target.value)}
                          className={input}
                          placeholder="Giải Nhất / Nhì..."
                        />
                      </div>

                      {/* Coins */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">🪙 Vàng thưởng</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">🪙</span>
                          <input
                            type="number"
                            value={prize.coins || 0}
                            onChange={e => formHandlers.updatePrize(idx, 'coins', Number(e.target.value))}
                            className={`${input} pl-8`}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      </div>

                      {/* Item + Qty */}
                      <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">🎁 Vật phẩm</label>
                          <select
                            value={prize.items?.[0]?.id || ''}
                            onChange={e => {
                              const id = e.target.value;
                              const qty = prize.items?.[0]?.quantity || 1;
                              formHandlers.updatePrize(idx, 'items', id ? [{ id, quantity: qty }] : []);
                            }}
                            className={`${input} text-xs`}
                          >
                            <option value="">-- Không --</option>
                            {shopItems.map(it => (
                              <option key={it.id} value={it.id}>{it.icon} {it.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-16 flex flex-col gap-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">SL</label>
                          <input
                            type="number"
                            disabled={!prize.items?.[0]?.id}
                            value={prize.items?.[0]?.quantity || 1}
                            onChange={e => {
                              const id = prize.items[0]?.id;
                              if (id) formHandlers.updatePrize(idx, 'items', [{ id, quantity: Number(e.target.value) }]);
                            }}
                            className={`${input} disabled:opacity-20`}
                            min="1"
                          />
                        </div>
                      </div>

                      {/* Note */}
                      <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Ghi chú (tùy chọn)</label>
                        <input
                          value={prize.description || ''}
                          onChange={e => formHandlers.updatePrize(idx, 'description', e.target.value)}
                          className={input}
                          placeholder="Thêm lời bình..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            <button
              disabled={creating}
              type="submit"
              className="bg-gradient-to-r from-xq-gold to-yellow-500 text-black px-8 py-3 rounded-xl font-black w-full text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {creating ? 'Đang lưu...' : formState.isEditing ? '💾 Lưu Thay Đổi' : '🏆 Xác Nhận Tạo Giải'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {tournaments.map(t => (
          <div key={t._id} className="bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-5 hover:border-black/20 dark:border-white/20 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-black text-slate-900 dark:text-white text-lg truncate">{t.name}</h3>
                  {t.champion && <span className="text-yellow-400 text-xs font-bold">🏆 {t.champion.name}</span>}
                </div>
                <p className="text-slate-600 dark:text-white/50 text-sm line-clamp-1 mb-2">{t.description}</p>
                <div className="text-xs text-slate-600 dark:text-white/40 font-mono flex items-center flex-wrap gap-3">
                  <span>👥 {t.players.length}{t.maxPlayers ? `/${t.maxPlayers}` : ''}</span>
                  {t.currentRound > 0 && (
                    <span>
                      Vòng <span className="text-xq-gold">{t.currentRound}</span>
                      {t.maxRounds ? `/${t.maxRounds}` : ''}
                    </span>
                  )}
                  {t.pendingPlayers && t.pendingPlayers.length > 0 && (
                    <span className="text-orange-400">⏳ {t.pendingPlayers.length} chờ duyệt</span>
                  )}
                  {t.registrationDeadline && <span>⏰ {new Date(t.registrationDeadline).toLocaleString('vi-VN')}</span>}
                  {t.prizes && t.prizes.length > 0 && (
                    <div className="flex gap-2">
                      {t.prizes.slice(0, 3).map((p, i) => (
                        <span key={i} title={p.title} className="bg-yellow-500/10 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500/20 text-[10px]">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.coins ? `🪙${p.coins}` : ''}{p.items?.[0] ? `🎒${p.items[0].quantity}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={t.status}
                  onChange={e => onStatusChange(t._id, e.target.value)}
                  className="bg-black/50 border border-black/20 dark:border-white/20 text-slate-900 dark:text-white text-xs rounded-lg px-2 py-1.5 outline-none"
                >
                  <option value="registration">📋 Ghi Danh</option>
                  <option value="active">⚔️ Thi Đấu</option>
                  <option value="finished">🏁 Kết Thúc</option>
                </select>
                <button
                  onClick={() => formHandlers.handleEdit(t)}
                  className="text-xq-gold hover:text-yellow-300 border border-xq-gold/30 hover:bg-xq-gold/10 px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  Sửa
                </button>
                <button
                  onClick={() => onDelete(t._id, t.name)}
                  className="text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
        {tournaments.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
            Chưa có giải đấu nào.
          </div>
        )}
        {paginationUI}
      </div>
    </div>
  );
};
