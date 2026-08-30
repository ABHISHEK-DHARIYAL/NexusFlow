import { aiConfig } from '../config/aiConfig';
import { logger } from '../logger';

export interface FileInputItem {
  path: string;
  content: string;
  language?: string | null;
  size?: number;
}

export interface SelectedInputResult {
  selectedFiles: FileInputItem[];
  filesConsideredCount: number;
  filesAnalyzedCount: number;
  analyzedPaths: string[];
  isPartial: boolean;
  totalBytes: number;
}

export class AIInputSelectionService {
  // Priority manifests and key architectural files
  private priorityFileNames = new Set([
    'readme.md',
    'readme',
    'package.json',
    'pom.xml',
    'build.gradle',
    'build.gradle.kts',
    'requirements.txt',
    'pyproject.toml',
    'cargo.toml',
    'go.mod',
    'dockerfile',
    'tsconfig.json',
    'vite.config.ts',
    'webpack.config.js',
    'server.ts',
    'app.ts',
    'index.ts',
    'main.ts',
  ]);

  public isSecretFile(filePath: string): boolean {
    const fileName = filePath.split('/').pop() || filePath;
    return aiConfig.secretFilePatterns.some((pattern) => pattern.test(fileName) || pattern.test(filePath));
  }

  public containsSecretContent(content: string): boolean {
    if (!content) return false;
    return aiConfig.secretContentRegexes.some((regex) => {
      // Reset lastIndex for global regexes
      regex.lastIndex = 0;
      return regex.test(content);
    });
  }

  public calculateFilePriority(filePath: string): number {
    const lowerPath = filePath.toLowerCase();
    const fileName = lowerPath.split('/').pop() || lowerPath;

    if (this.priorityFileNames.has(fileName)) {
      return 100;
    }
    if (lowerPath.includes('src/server') || lowerPath.includes('src/core') || lowerPath.includes('src/main')) {
      return 80;
    }
    if (lowerPath.includes('src/') || lowerPath.includes('lib/')) {
      return 60;
    }
    if (lowerPath.endsWith('.ts') || lowerPath.endsWith('.js') || lowerPath.endsWith('.java') || lowerPath.endsWith('.go') || lowerPath.endsWith('.py')) {
      return 50;
    }
    return 10;
  }

  public selectFilesForAnalysis(allFiles: FileInputItem[]): SelectedInputResult {
    const filesConsideredCount = allFiles.length;
    
    // 1. Filter secret files
    const nonSecretFiles = allFiles.filter((file) => {
      if (this.isSecretFile(file.path)) {
        logger.ai.warn(`Skipping file matching secret pattern: ${file.path}`);
        return false;
      }
      return true;
    });

    // 2. Sanitize and redact content if inline secrets exist
    const sanitizedFiles = nonSecretFiles.map((file) => {
      if (this.containsSecretContent(file.content)) {
        logger.ai.warn(`Redacting secret content in file: ${file.path}`);
        return {
          ...file,
          content: '[REDACTED: Potential secret detected in file content]',
        };
      }
      return file;
    });

    // 3. Sort files by priority descending
    sanitizedFiles.sort((a, b) => this.calculateFilePriority(b.path) - this.calculateFilePriority(a.path));

    // 4. Budget limit enforcement
    const selectedFiles: FileInputItem[] = [];
    let currentBytes = 0;
    let isPartial = false;

    for (const file of sanitizedFiles) {
      const contentBytes = Buffer.byteLength(file.content || '', 'utf8');
      if (currentBytes + contentBytes > aiConfig.maxInputBytes) {
        if (selectedFiles.length > 0) {
          isPartial = true;
          // If repository is larger than budget, stop adding more files
          break;
        }
        // If single file exceeds budget, truncate content safely
        const truncatedContent = file.content.substring(0, aiConfig.maxInputBytes - 500) + '\n... [TRUNCATED DUE TO SIZE LIMIT]';
        selectedFiles.push({
          ...file,
          content: truncatedContent,
        });
        currentBytes += Buffer.byteLength(truncatedContent, 'utf8');
        isPartial = true;
        break;
      }

      selectedFiles.push(file);
      currentBytes += contentBytes;
    }

    if (filesConsideredCount > selectedFiles.length) {
      isPartial = true;
    }

    const analyzedPaths = selectedFiles.map((f) => f.path);

    logger.ai.info(`File selection complete. Selected ${selectedFiles.length}/${filesConsideredCount} files (${currentBytes} bytes). Partial: ${isPartial}`);

    return {
      selectedFiles,
      filesConsideredCount,
      filesAnalyzedCount: selectedFiles.length,
      analyzedPaths,
      isPartial,
      totalBytes: currentBytes,
    };
  }
}

export const aiInputSelectionService = new AIInputSelectionService();
