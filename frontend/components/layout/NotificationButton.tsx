import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';

export const NotificationButton: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount } = useNotificationStore();

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
          {unreadCount}
        </span>
      )}
    </button>
  );
};
