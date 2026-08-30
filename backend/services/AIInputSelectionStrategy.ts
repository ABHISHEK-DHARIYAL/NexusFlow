import { aiConfig } from '../config/aiConfig';
import {
  isExcludedDirectory,
  isBinaryOrMediaFile,
  isSecretFilePath,
  sanitizeContent,
} from '../utils/secretFilter';

export interface FileInput {
  path: string;
  content?: string | null;
  size?: number | bigint;
  language?: string | null;
}

export interface SelectedContext {
  filesAnalyzed: Array<{ path: string; language?: string; size: number }>;
  totalEligibleFiles: number;
  inputCoverage: number; // 0.0 to 1.0 (e.g. 0.85 = 85%)
  isPartial: boolean;
  formattedContext: string;
}

export class AIInputSelectionStrategy {
  private getPriorityWeight(filePath: string): number {
    const lower = filePath.toLowerCase();
    const fileName = filePath.split('/').pop()?.toLowerCase() || lower;

    // 1. Documentation
    if (fileName.startsWith('readme')) return 10;

    // 2. Package / Build Manifests
    if (
      [
        'package.json',
        'pom.xml',
        'build.gradle',
        'build.gradle.kts',
        'requirements.txt',
        'pyproject.toml',
        'cargo.toml',
        'go.mod',
        'dockerfile',
        'docker-compose.yml',
      ].includes(fileName)
    ) {
      return 9;
    }

    // 3. Main Entry Points
    if (
      [
        'index.ts',
        'index.js',
        'main.ts',
        'main.js',
        'server.ts',
        'server.js',
        'app.ts',
        'app.js',
        'main.java',
        'app.java',
        'main.go',
        'main.py',
      ].includes(fileName) ||
      lower.includes('src/index') ||
      lower.includes('src/main') ||
      lower.includes('src/app') ||
      lower.includes('src/server')
    ) {
      return 8;
    }

    // 4. Configuration
    if (
      fileName.endsWith('.json') ||
      fileName.endsWith('.config.ts') ||
      fileName.endsWith('.config.js')
    ) {
      return 7;
    }

    // 5. Core Source Code
    if (lower.startsWith('src/') || lower.startsWith('lib/') || lower.startsWith('app/')) {
      return 5;
    }

    return 2;
  }

  /**
   * Returns the top-ranked eligible file paths (by the same priority/size
   * ordering used in selectContext), without requiring content to already
   * be populated. Callers can use this to decide which files are worth
   * fetching real content for, before paying the cost of fetching it.
   */
  public selectCandidatePaths(files: FileInput[], limit: number): FileInput[] {
    const eligibleFiles = files.filter((f) => {
      if (isExcludedDirectory(f.path)) return false;
      if (isBinaryOrMediaFile(f.path)) return false;
      if (isSecretFilePath(f.path)) return false;
      return true;
    });

    const sortedFiles = [...eligibleFiles].sort((a, b) => {
      const weightA = this.getPriorityWeight(a.path);
      const weightB = this.getPriorityWeight(b.path);
      if (weightA !== weightB) return weightB - weightA;

      const sizeA = Number(a.size || 0);
      const sizeB = Number(b.size || 0);
      return sizeA - sizeB;
    });

    return sortedFiles.slice(0, limit);
  }

  public selectContext(files: FileInput[]): SelectedContext {
    // 1. Filter out prohibited files
    const eligibleFiles = files.filter((f) => {
      if (isExcludedDirectory(f.path)) return false;
      if (isBinaryOrMediaFile(f.path)) return false;
      if (isSecretFilePath(f.path)) return false;
      return true;
    });

    // 2. Sort by Priority Weight (Desc) and then Size (Asc)
    const sortedFiles = [...eligibleFiles].sort((a, b) => {
      const weightA = this.getPriorityWeight(a.path);
      const weightB = this.getPriorityWeight(b.path);
      if (weightA !== weightB) return weightB - weightA;
      
      const sizeA = Number(a.size || 0);
      const sizeB = Number(b.size || 0);
      return sizeA - sizeB;
    });

    const selectedFiles: Array<{ path: string; language?: string; size: number }> = [];
    let currentTotalBytes = 0;
    let contextBlocks: string[] = [];

    for (const file of sortedFiles) {
      if (selectedFiles.length >= aiConfig.maxFilesPerAnalysis) {
        break;
      }

      const content = file.content || `// File path: ${file.path} (content truncated or unavailable)`;
      const { cleanContent } = sanitizeContent(content);
      const contentBytes = Buffer.byteLength(cleanContent, 'utf-8');

      if (currentTotalBytes + contentBytes > aiConfig.maxTotalInputBytes && selectedFiles.length > 0) {
        // Stop adding to maintain input size budget
        break;
      }

      selectedFiles.push({
        path: file.path,
        language: file.language || undefined,
        size: Number(file.size || contentBytes),
      });

      currentTotalBytes += contentBytes;
      contextBlocks.push(`--- FILE: ${file.path} ---\n${cleanContent}\n`);
    }

    const totalEligibleCount = eligibleFiles.length || 1;
    const inputCoverage = Math.min(1.0, selectedFiles.length / totalEligibleCount);
    const isPartial = selectedFiles.length < eligibleFiles.length;

    return {
      filesAnalyzed: selectedFiles,
      totalEligibleFiles: totalEligibleCount,
      inputCoverage: Math.round(inputCoverage * 100) / 100,
      isPartial,
      formattedContext: contextBlocks.join('\n'),
    };
  }
}

export const aiInputSelectionStrategy = new AIInputSelectionStrategy();
