import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-full mb-4">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-100 font-mono">404</h1>
      <h2 className="text-lg font-semibold text-slate-300 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        The route or resource you requested does not exist or has been moved.
      </p>
      <Button
        onClick={() => navigate('/dashboard')}
        className="mt-6"
        leftIcon={<Home className="w-4 h-4" />}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};
