import {
  GithubRepository,
  GithubBranch,
  GithubCommit,
  GithubContributor,
  GithubIssue,
  GithubPullRequest,
  GithubLanguagesResponse,
} from './GithubTypes';

export class GithubMapper {
  public static mapRepository(ghRepo: GithubRepository, userId: string) {
    return {
      userId,
      githubRepoId: BigInt(ghRepo.id),
      owner: ghRepo.owner.login,
      name: ghRepo.name,
      fullName: ghRepo.full_name,
      description: ghRepo.description || null,
      defaultBranch: ghRepo.default_branch || 'main',
      visibility: (ghRepo.private ? 'PRIVATE' : 'PUBLIC') as 'PUBLIC' | 'PRIVATE',
      language: ghRepo.language || null,
      starsCount: ghRepo.stargazers_count || 0,
      forksCount: ghRepo.forks_count || 0,
      openIssues: ghRepo.open_issues_count || 0,
      githubUrl: ghRepo.html_url,
      cloneUrl: ghRepo.clone_url,
      syncStatus: 'SYNCED' as const,
      lastSyncedAt: new Date(),
    };
  }

  public static mapMetadata(ghRepo: GithubRepository) {
    return {
      license: ghRepo.license?.spdx_id || ghRepo.license?.name || null,
      isFork: Boolean(ghRepo.fork),
      isArchived: Boolean(ghRepo.archived),
      hasTopics: ghRepo.topics ? JSON.stringify(ghRepo.topics) : null,
    };
  }

  public static mapBranch(ghBranch: GithubBranch) {
    return {
      name: ghBranch.name,
      isProtected: Boolean(ghBranch.protected),
      commitSha: ghBranch.commit?.sha || null,
    };
  }

  public static mapCommit(ghCommit: GithubCommit) {
    const commitDateStr = ghCommit.commit?.author?.date || ghCommit.commit?.committer?.date;
    return {
      sha: ghCommit.sha,
      message: ghCommit.commit?.message || '',
      authorName: ghCommit.commit?.author?.name || ghCommit.author?.login || null,
      authorEmail: ghCommit.commit?.author?.email || null,
      authorAvatarUrl: ghCommit.author?.avatar_url || null,
      commitDate: commitDateStr ? new Date(commitDateStr) : new Date(),
      githubUrl: ghCommit.html_url || null,
    };
  }

  public static mapContributor(ghContrib: GithubContributor) {
    return {
      username: ghContrib.login,
      avatarUrl: ghContrib.avatar_url || null,
      contributions: ghContrib.contributions || 0,
      profileUrl: ghContrib.html_url || null,
    };
  }

  public static mapIssue(ghIssue: GithubIssue) {
    return {
      issueNumber: ghIssue.number,
      title: ghIssue.title,
      state: ghIssue.state || 'open',
      authorUsername: ghIssue.user?.login || null,
      authorAvatarUrl: ghIssue.user?.avatar_url || null,
      labels: ghIssue.labels ? JSON.stringify(ghIssue.labels.map((l) => l.name)) : null,
      githubUrl: ghIssue.html_url,
      githubCreatedAt: ghIssue.created_at ? new Date(ghIssue.created_at) : new Date(),
      githubUpdatedAt: ghIssue.updated_at ? new Date(ghIssue.updated_at) : new Date(),
    };
  }

  public static mapPullRequest(ghPr: GithubPullRequest) {
    const isMerged = Boolean(ghPr.merged_at || ghPr.merged);
    return {
      prNumber: ghPr.number,
      title: ghPr.title,
      state: ghPr.state || 'open',
      authorUsername: ghPr.user?.login || null,
      authorAvatarUrl: ghPr.user?.avatar_url || null,
      isMerged,
      githubUrl: ghPr.html_url,
      githubCreatedAt: ghPr.created_at ? new Date(ghPr.created_at) : new Date(),
      githubUpdatedAt: ghPr.updated_at ? new Date(ghPr.updated_at) : new Date(),
    };
  }

  public static mapLanguages(langResponse: GithubLanguagesResponse) {
    const entries = Object.entries(langResponse || {});
    const totalBytes = entries.reduce((acc, [_, bytes]) => acc + bytes, 0);

    return entries.map(([name, bytes]) => {
      const percentage = totalBytes > 0 ? parseFloat(((bytes / totalBytes) * 100).toFixed(2)) : 0;
      return {
        name,
        bytes: BigInt(bytes),
        percentage,
      };
    });
  }
}
