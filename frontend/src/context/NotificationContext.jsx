import React, { createContext, useContext, useState, useEffect } from 'react';
import { alertService } from '../services/alertService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  const fetchAlerts = async () => {
    try {
      const data = await alertService.getAlerts();
      const list = Array.isArray(data) ? data : (data.alerts || []);
      setAlerts(list);
      setUnreadCount(list.filter(a => !a.is_read).length);
    } catch (err) {
      console.warn("Alerts fetch note:", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    await alertService.markRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <NotificationContext.Provider value={{ alerts, unreadCount, markAsRead, fetchAlerts, showToast, toast }}>
      {children}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-white font-medium flex items-center gap-2 animate-bounce transition-all ${
          toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-govblue-700'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
