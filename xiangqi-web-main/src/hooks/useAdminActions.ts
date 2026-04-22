import { API_URL } from '../auth/auth';
import { useDialog } from '../components/ui/DialogContext';

export function useAdminActions(authState: any, fetchData: () => void) {
  const { showAlert, showConfirm, showPrompt } = useDialog();

  const handleUpdateRole = async (uid: string, newRole: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    await fetch(`${API_URL}/admin/users/${uid}/role`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({ newRole }),
    });
    fetchData();
  };

  const handleUpdateElo = async (uid: string, oldElo: number) => {
    const val = await showPrompt('Skill Rating Update', `Nhập ELO mới cho kỳ thủ (hiện tại: ${oldElo}):`, String(oldElo));
    if (val === null) return;
    const elo = Number(val);
    if (isNaN(elo)) return showAlert('Lỗi nhập liệu', 'Số ELO không hợp lệ. Vui lòng nhập một con số.', 'danger');
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    await fetch(`${API_URL}/admin/users/${uid}/elo`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({ elo }),
    });
    fetchData();
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    const confirmed = await showConfirm(
      'Xác nhận xóa Kỳ thủ', 
      `Bạn có chắc chắn muốn xóa vĩnh viễn user "${name}"? Thao tác này không thể hoàn tác và sẽ xóa toàn bộ lịch sử ván đấu liên quan.`,
      'danger',
      'Xóa vĩnh viễn'
    );
    if (!confirmed) return;

    const headers: Record<string, string> = {};
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    await fetch(`${API_URL}/admin/users/${uid}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    fetchData();
  };

  const handleDeleteMatch = async (id: string) => {
    const confirmed = await showConfirm('Xác nhận thao tác', `Xóa/Đóng phòng "${id}"?`, 'warning');
    if (!confirmed) return;
    const headers: Record<string, string> = {};
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    await fetch(`${API_URL}/admin/matches/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    fetchData();
  };

  const handleClearCache = async () => {
    const confirmed = await showConfirm(
      'Xóa toàn bộ Cache', 
      'Bạn có chắc chắn muốn xóa toàn bộ Cache Redis? Thao tác này sẽ làm mới dữ liệu cho tất cả người dùng và có thể làm giảm hiệu năng hệ thống tạm thời.', 
      'danger',
      'Xác nhận xóa sạch'
    );
    if (!confirmed) return;
    
    const headers: Record<string, string> = {};
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    try {
      const res = await fetch(`${API_URL}/admin/cache`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (!data.ok) showAlert('Lỗi xóa cache', data.error || 'Unknown error', 'danger');
      else showAlert('Thành công', 'Đã xóa toàn bộ cache!', 'success');
    } catch (err: any) {
      showAlert('Lỗi kết nối', err.message, 'danger');
    }
    fetchData();
  };

  const handleDeleteCacheKey = async (key: string) => {
    const confirmed = await showConfirm('Xác nhận xóa', `Xóa key "${key}" khỏi Redis?`, 'warning');
    if (!confirmed) return;
    const headers: Record<string, string> = {};
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    await fetch(`${API_URL}/admin/cache/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    fetchData();
  };

  const handleDeletePuzzle = async (id: string, name: string) => {
    const confirmed = await showConfirm('Xóa thế cờ', `Xác nhận xóa vĩnh viễn thế cờ "${name}"?`, 'danger');
    if (!confirmed) return;
    const headers: Record<string, string> = {};
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    await fetch(`${API_URL}/admin/puzzles/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    fetchData();
  };

  const handleStatusChange = async (id: string, status: string) => {
    if (status === 'finished') {
      const headers: Record<string, string> = {};
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
      await fetch(`${API_URL}/admin/tournaments/${id}/finish`, {
        method: 'POST',
        headers,
        credentials: 'include'
      });
    } else {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
      await fetch(`${API_URL}/admin/tournaments/${id}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status })
      });
    }
    fetchData();
  };

  const handleDeleteTournament = async (id: string, name: string) => {
    const confirmed = await showConfirm('Xóa giải đấu', `Xác nhận xóa giải "${name}"?`, 'danger');
    if (!confirmed) return;
    const headers: Record<string, string> = {};
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    await fetch(`${API_URL}/admin/tournaments/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    fetchData();
  };

  const handleDeleteComment = async (type: string, id: string) => {
    const confirmed = await showConfirm('Xóa bình luận', 'Xác nhận xóa bình luận này?', 'warning');
    if (!confirmed) return;
    const headers: Record<string, string> = {};
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    await fetch(`${API_URL}/admin/comments/${type}/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    fetchData();
  };

  const handleUpsertGift = async (gift: any) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    await fetch(`${API_URL}/admin/gifts`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(gift),
    });
    fetchData();
  };

  const handleDeleteGift = async (id: string, name: string) => {
    const confirmed = await showConfirm('Xóa món quà', `Xoá món quà "${name}"? Thao tác này có thể ảnh hưởng đến người dùng đang sở hữu.`, 'danger');
    if (!confirmed) return;
    const headers: Record<string, string> = {};
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    await fetch(`${API_URL}/admin/gifts/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    fetchData();
  };

  return {
    handleUpdateRole,
    handleUpdateElo,
    handleDeleteUser,
    handleDeleteMatch,
    handleClearCache,
    handleDeleteCacheKey,
    handleDeletePuzzle,
    handleStatusChange,
    handleDeleteTournament,
    handleDeleteComment,
    handleUpsertGift,
    handleDeleteGift
  };
}
