'use client';

import React, { useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const ToastComponent: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const getToastStyles = () => {
    const baseStyles = 'fixed top-4 z-50 flex items-center justify-between p-4 rounded-lg shadow-lg transition-all duration-300 transform';

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500 text-white`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white`;
      case 'warning':
        return `${baseStyles} bg-yellow-500 text-white`;
      case 'info':
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
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3000) => {
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
        type={toast.type as any}
        onClose={hideToast}
      />
    );
  };

  return { showToast, hideToast, ToastContainer };
};