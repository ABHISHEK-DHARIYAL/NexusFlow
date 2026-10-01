import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Settings, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';

export const UserMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const items = [
    { id: 'profile', label: 'View Profile', icon: <UserIcon className="w-4 h-4" />, onClick: () => navigate('/profile') },
    { id: 'settings', label: 'Account Settings', icon: <Settings className="w-4 h-4" />, onClick: () => navigate('/settings') },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4 text-red-400" />,
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Dropdown
      align="right"
      trigger={
        <div className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
          <Avatar src={user.avatarUrl} name={user.name} size="sm" />
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200">{user.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">@{user.username}</span>
          </div>
        </div>
      }
      items={items}
    />
  );
};
