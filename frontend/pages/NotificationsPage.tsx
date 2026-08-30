import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../hooks';
import { CheckCheck, AlertTriangle, Info, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, isLoading, error, refetch, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'SECURITY_WARNING':
        return <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'ANALYSIS_READY':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <PageContainer
      title="Notifications & Alerts"
      description="System alerts, security flags, and background analysis completion events."
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck className="w-4 h-4" />}
            onClick={markAllAsRead}
          >
            Mark All Read
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span>Loading notifications...</span>
          </div>
        ) : error ? (
          <Card className="p-6 text-center text-xs text-red-300 border-red-800/50 bg-red-950/20">
            Failed to load notifications: {error}
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            No notifications at this time.
          </Card>
        ) : (
          notifications.map((ntf) => (
            <Card
              key={ntf.id}
              className={`flex items-start justify-between gap-4 p-4 transition-colors ${
                !ntf.isRead ? 'border-l-4 border-l-blue-500 bg-slate-900/90' : 'opacity-80'
              }`}
            >
              <div className="flex items-start gap-3">
                {getIcon(ntf.type)}
                <div>
                  <h4 className="font-semibold text-slate-100 text-sm">{ntf.title}</h4>
                  <p className="text-xs text-slate-300 mt-1">{ntf.message}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-2 block">
                    {new Date(ntf.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!ntf.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(ntf.id)}>
                    Mark Read
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
};
