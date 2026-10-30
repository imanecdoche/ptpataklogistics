import React, { createContext, useContext, useState, useCallback } from 'react';
import { CustomDialog } from '@/components/ui/CustomDialog';

export interface AlertOptions {
  title: string;
  message: string;
  iconSrc?: string;
  confirmText?: string;
  onClose?: () => void;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  iconSrc?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface DialogContextValue {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: ConfirmOptions) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconSrc, setIconSrc] = useState<string | undefined>(undefined);
  const [confirmText, setConfirmText] = useState<string | undefined>('OK');
  const [cancelText, setCancelText] = useState<string | undefined>(undefined);
  const [isDestructive, setIsDestructive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(null);
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | null>(null);

  const closeDialog = useCallback((): void => {
    setIsOpen(false);
    setIsLoading(false);
    if (onCloseCallback) {
      onCloseCallback();
    }
  }, [onCloseCallback]);

  const showAlert = useCallback((options: AlertOptions): void => {
    setTitle(options.title);
    setDescription(options.message);
    setIconSrc(options.iconSrc);
    setConfirmText(options.confirmText || 'OK');
    setCancelText(undefined);
    setIsDestructive(false);
    setIsLoading(false);
    setOnConfirmCallback(null);
    setOnCloseCallback(() => options.onClose || null);
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): void => {
    setTitle(options.title);
    setDescription(options.message);
    setIconSrc(options.iconSrc);
    setConfirmText(options.confirmText || 'Konfirmasi');
    setCancelText(options.cancelText || 'Batal');
    setIsDestructive(options.isDestructive || false);
    setIsLoading(false);
    setOnConfirmCallback(() => options.onConfirm);
    setOnCloseCallback(() => options.onCancel || null);
    setIsOpen(true);
  }, []);

  const handleConfirm = async (): Promise<void> => {
    if (!onConfirmCallback) {
      closeDialog();
      return;
    }

    try {
      setIsLoading(true);
      await onConfirmCallback();
      setIsOpen(false);
    } catch (error) {
      console.error('Dialog action error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, closeDialog }}>
      {children}
      <CustomDialog
        isOpen={isOpen}
        onClose={closeDialog}
        title={title}
        description={description}
        iconSrc={iconSrc}
        confirmText={confirmText}
        cancelText={cancelText}
        isDestructive={isDestructive}
        isLoading={isLoading}
        onConfirm={handleConfirm}
      />
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
