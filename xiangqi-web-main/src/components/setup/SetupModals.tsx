import React from 'react';
import { useTranslation } from 'react-i18next';
import { Confirm, Alert } from '../ui/Dialog';

interface SetupModalsProps {
  duplicateInfo: { uid: string; name: string } | null;
  setDuplicateInfo: (info: any) => void;
  isClearOpen: boolean;
  setIsClearOpen: (open: boolean) => void;
  onClearBoard: () => void;
  alertInfo: any;
  setAlertInfo: (info: any) => void;
  onViewDuplicate: () => void;
}

export const SetupModals: React.FC<SetupModalsProps> = ({
  duplicateInfo,
  setDuplicateInfo,
  isClearOpen,
  setIsClearOpen,
  onClearBoard,
  alertInfo,
  setAlertInfo,
  onViewDuplicate
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Confirm 
        isOpen={!!duplicateInfo} 
        onClose={() => setDuplicateInfo(null)} 
        onConfirm={onViewDuplicate} 
        title={t('setup.modals.duplicateTitle')} 
        message={t('setup.modals.duplicateMsg', { name: duplicateInfo?.name })} 
        confirmLabel={t('setup.modals.duplicateAction')} 
        variant="warning" 
      />


      <Confirm 
        isOpen={isClearOpen} 
        onClose={() => setIsClearOpen(false)} 
        onConfirm={onClearBoard} 
        title={t('setup.modals.clearTitle')} 
        message={t('setup.modals.clearMsg')} 
        variant="danger" 
      />

      <Alert
        isOpen={alertInfo.show}
        onClose={() => setAlertInfo((prev: any) => ({ ...prev, show: false }))}
        title={alertInfo.title}
        message={alertInfo.message}
        variant={alertInfo.variant}
      />
    </>
  );
};
