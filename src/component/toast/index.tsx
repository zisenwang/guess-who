'use client';

import React, { useState } from 'react';

export enum ToastType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
}

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const ToastComponent: React.FC<ToastProps> = ({ message, type = ToastType.Info, onClose }) => {
  const getToastStyles = () => {
    const baseStyles = 'fixed top-4 z-50 flex items-center justify-between p-4 rounded-lg shadow-lg transition-all duration-300 transform';

    switch (type) {
      case ToastType.Success:
        return `${baseStyles} bg-green-500 text-white`;
      case ToastType.Error:
        return `${baseStyles} bg-red-500 text-white`;
      case ToastType.Warning:
        return `${baseStyles} bg-yellow-500 text-white`;
      case ToastType.Info:
      default:
        return `${baseStyles} bg-blue-500 text-white`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info':
      default: return 'ℹ';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold">{getIcon()}</span>
        <span className="font-medium">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 transition-colors"
      >
        ✕
      </button>
    </div>
  );
};

export default ToastComponent;

// Simple toast hook
export const useSimpleToast = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = ToastType.Info, duration = 3000) => {
    setToast({ message, type });

    if (duration > 0) {
      setTimeout(() => {
        setToast(null);
      }, duration);
    }
  };

  const hideToast = () => setToast(null);

  const ToastContainer = () => {
    if (!toast) return null;

    return (
      <ToastComponent
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    );
  };

  return { showToast, hideToast, ToastContainer };
};