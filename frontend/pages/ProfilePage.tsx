import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/useAuthStore';
import { User, Shield, Mail, Calendar } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <PageContainer title="User Profile">
      <Card className="max-w-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} name={user.name} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user.name}</h2>
            <p className="text-xs text-slate-400 font-mono">@{user.username}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="purple" size="sm">{user.role}</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Email: {user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>Role: {user.role}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Member Since: {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};
