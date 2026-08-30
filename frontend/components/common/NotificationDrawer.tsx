import React from 'react';
import { X, Check, Bell, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Notification } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-sm flex-col border-l border-slate-800 bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100">Notifications</h2>
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300 font-mono">
              {notifications.filter((n) => !n.isRead).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 transition rounded-lg ${
                  n.isRead ? 'opacity-60 bg-transparent' : 'bg-slate-800/40 border border-slate-800/80'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {n.type === 'SECURITY_WARNING' && (
                    <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  )}
                  {n.type === 'TASK_COMPLETED' && (
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  )}
                  {n.type === 'ANALYSIS_READY' && (
                    <Bell className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {n.title}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!n.isRead && (
                        <button
                          onClick={() => onMarkRead(n.id)}
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                        >
                          <Check className="h-3 w-3" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
