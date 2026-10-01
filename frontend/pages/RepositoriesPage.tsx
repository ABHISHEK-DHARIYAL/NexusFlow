import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { RepositoryCard } from '../components/repository/RepositoryCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { GithubImportModal } from '../components/repositories/GithubImportModal';
import { useRepositories } from '../hooks';
import { Search, Plus, RefreshCw, Loader2, Github } from 'lucide-react';

export const RepositoriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedVisibility, setSelectedVisibility] = useState('ALL');
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

  const { repositories, isLoading, refetch } = useRepositories({
    search: searchQuery,
    language: selectedLanguage !== 'ALL' ? selectedLanguage : undefined,
    visibility: selectedVisibility !== 'ALL' ? selectedVisibility : undefined,
  });

  const filteredRepos = repositories.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLang = selectedLanguage === 'ALL' || repo.language === selectedLanguage;
    const matchesVis = selectedVisibility === 'ALL' || repo.visibility === selectedVisibility;
    return matchesSearch && matchesLang && matchesVis;
  });

  return (
    <PageContainer
      title="Repositories"
      description="Connected GitHub repositories under continuous NexusFlow verification."
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
            leftIcon={<Github className="w-4 h-4" />}
            onClick={() => setIsGithubModalOpen(true)}
            size="sm"
          >
            Import Repository
          </Button>
        </div>
      }
    >
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search repositories by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            options={[
              { value: 'ALL', label: 'All Languages' },
              { value: 'TypeScript', label: 'TypeScript' },
              { value: 'Java', label: 'Java' },
              { value: 'Python', label: 'Python' },
              { value: 'Go', label: 'Go' },
            ]}
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          />
          <Select
            options={[
              { value: 'ALL', label: 'All Visibilities' },
              { value: 'PUBLIC', label: 'Public' },
              { value: 'PRIVATE', label: 'Private' },
            ]}
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Repositories */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span>Loading repositories from backend...</span>
        </div>
      ) : filteredRepos.length === 0 ? (
        <EmptyState
          title="No repositories found"
          description="Try adjusting your filters or import a new GitHub repository."
          actionLabel="Import Repository"
          onAction={() => setIsGithubModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos.map((repo) => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}
        </div>
      )}

      {/* GitHub Integration Importer Modal */}
      <GithubImportModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
        onImportSuccess={() => {
          refetch();
        }}
      />
    </PageContainer>
  );
};
