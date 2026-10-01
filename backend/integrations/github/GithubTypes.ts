export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  public_repos?: number;
  total_private_repos?: number;
}

export interface GithubRepositoryOwner {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface GithubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: GithubRepositoryOwner;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  clone_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  license?: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
  } | null;
  topics?: string[];
  archived?: boolean;
  visibility?: 'public' | 'private' | 'internal';
}

export interface GithubBranch {
  name: string;
  protected: boolean;
  commit: {
    sha: string;
    url: string;
  };
}

export interface GithubCommit {
  sha: string;
  node_id: string;
  html_url: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    } | null;
    committer: {
      name: string;
      email: string;
      date: string;
    } | null;
    message: string;
  };
  author: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
}

export interface GithubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export interface GithubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  labels: GithubLabel[];
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  pull_request?: {
    url: string;
    html_url: string;
  };
}

export interface GithubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  merged_at?: string | null;
  merged?: boolean;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
}

export type GithubLanguagesResponse = Record<string, number>;

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface ListUserRepositoriesParams extends PaginationParams {
  visibility?: 'all' | 'public' | 'private';
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  direction?: 'asc' | 'desc';
  search?: string;
}

export interface GithubRateLimitStatus {
  limit: number;
  remaining: number;
  reset: number; // UNIX timestamp
  used: number;
}

export interface GithubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
  url: string;
}

export interface GithubTreeResponse {
  sha: string;
  url: string;
  tree: GithubTreeItem[];
  truncated: boolean;
}
