import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../net/socket';
import { useToast } from '../components/ui/Toast';
import { logger } from '../utils/logger';
import { useChallengeContext } from '../components/ChallengeContext';

export function useInvitations() {
  const { info } = useToast();
  const navigate = useNavigate();
  const { addSystemNotif } = useChallengeContext();

  useEffect(() => {
    logger.debug('[INVITATION] useInvitations hook mounted, listening...');
    const socket = getSocket();
    if (!socket) return;

    const handleInvitation = (data: { roomId: string; creatorName: string; timeMode: string }) => {
      logger.info('[INVITATION] Received from server:', data);
      
      const title = 'Phòng chơi mới';
      const body = `Có bàn cờ mới do ${data.creatorName} mở - ${data.timeMode}`;
      const url = `/game/${data.roomId}`;

      // 1. Show interactive toast
      info(body, {
        duration: 15000, 
        actions: [
          {
            label: 'VÀO XEM',
            variant: 'primary',
            onClick: () => {
              logger.info(`[INVITATION] User accepted, navigating to ${url}`);
              navigate(url);
            }
          },
          {
            label: 'BỎ QUA',
            variant: 'secondary',
            onClick: () => {
              logger.info('[INVITATION] User declined.');
            }
          }
        ]
      });

      // 2. Add to bell notification (persistent)
      addSystemNotif({
        id: `invite-${data.roomId}-${Date.now()}`,
        title,
        body,
        url,
        createdAt: Date.now()
      });
    };

    socket.on('room:invitation', handleInvitation);

    return () => {
      socket.off('room:invitation', handleInvitation);
    };
  }, [info, navigate, addSystemNotif]);
}
