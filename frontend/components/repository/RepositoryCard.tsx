import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Star, GitFork, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Repository } from '../../types';

export interface RepositoryCardProps {
  repository: Repository;
}

export const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository }) => {
  const navigate = useNavigate();

  const getHealthBadgeVariant = (score?: number) => {
    if (!score) return 'slate';
    if (score >= 90) return 'emerald';
    if (score >= 75) return 'amber';
    return 'rose';
  };

  const renderSyncBadge = () => {
    const status = repository.syncStatus || 'SYNCED';
    switch (status) {
      case 'SYNCED':
        return (
          <Badge variant="emerald" size="sm">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Synced
          </Badge>
        );
      case 'SYNCING':
      case 'IMPORTING':
        return (
          <Badge variant="blue" size="sm">
            <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" /> Syncing
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="rose" size="sm">
            <AlertCircle className="w-2.5 h-2.5 mr-1" /> Sync Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="slate" size="sm">
            Not Synced
          </Badge>
        );
    }
  };

  return (
    <Card
      hoverable
      onClick={() => navigate(`/repositories/${repository.id}`)}
      className="flex flex-col justify-between h-full group"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="w-4 h-4 text-blue-400 shrink-0" />
            <h3 className="font-semibold text-slate-100 text-sm group-hover:text-blue-400 transition-colors truncate">
              {repository.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {renderSyncBadge()}
            <Badge variant={repository.visibility === 'PRIVATE' ? 'slate' : 'blue'} size="sm">
              {repository.visibility}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-4">
          {repository.description || 'No description provided.'}
        </p>
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Health Score</span>
          <Badge variant={getHealthBadgeVariant(repository.healthScore)} size="sm">
            {repository.healthScore ? `${repository.healthScore}%` : 'Unanalyzed'}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              {repository.language || 'Code'}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              {repository.starsCount}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              {repository.forksCount}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            {repository.lastSyncedAt ? new Date(repository.lastSyncedAt).toLocaleDateString() : 'Never'}
          </span>
        </div>
      </div>
    </Card>
  );
};
