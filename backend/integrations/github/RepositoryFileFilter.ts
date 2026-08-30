import path from 'path';

export interface FileFilterOptions {
  maxSizeBytes?: number; // Default 5MB (5 * 1024 * 1024)
  excludedDirectories?: string[];
  excludedExtensions?: string[];
  includedExtensions?: string[];
}

export class RepositoryFileFilter {
  private maxSizeBytes: number;
  private excludedDirectories: Set<string>;
  private excludedExtensions: Set<string>;
  private includedExtensions: Set<string> | null;

  private static DEFAULT_EXCLUDED_DIRECTORIES = [
    '.git',
    'node_modules',
    'dist',
    'build',
    'target',
    'coverage',
    'vendor',
    '.next',
    '.idea',
    '.vscode',
    '.mvn',
    '__pycache__',
    '.gradle',
    'bin',
    'obj',
  ];

  private static DEFAULT_EXCLUDED_EXTENSIONS = [
    // Binaries & Executables
    '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.war', '.ear', '.pyc', '.pyo', '.o', '.a', '.obj',
    // Archives
    '.zip', '.tar', '.gz', '.7z', '.rar', '.bz2', '.xz',
    // Images & Media
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.bmp', '.tiff',
    '.mp3', '.mp4', '.mov', '.avi', '.wav', '.flac', '.m4a', '.ogg',
    // Fonts & Documents
    '.pdf', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.doc', '.docx', '.xls', '.xlsx',
    // DB & Other
    '.db', '.sqlite', '.sqlite3', '.bin', '.dat', '.DS_Store',
  ];

  private static EXTENSION_TO_LANGUAGE: Record<string, string> = {
    '.java': 'Java',
    '.c': 'C',
    '.h': 'C',
    '.cpp': 'C++',
    '.cc': 'C++',
    '.cxx': 'C++',
    '.hpp': 'C++',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.mjs': 'JavaScript',
    '.cjs': 'JavaScript',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.py': 'Python',
    '.go': 'Go',
    '.rs': 'Rust',
    '.kt': 'Kotlin',
    '.kts': 'Kotlin',
    '.swift': 'Swift',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.html': 'HTML',
    '.htm': 'HTML',
    '.css': 'CSS',
    '.scss': 'CSS',
    '.sass': 'CSS',
    '.sql': 'SQL',
    '.sh': 'Shell',
    '.bash': 'Shell',
    '.zsh': 'Shell',
    '.md': 'Markdown',
    '.markdown': 'Markdown',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.xml': 'XML',
    '.toml': 'TOML',
    '.properties': 'Properties',
  };

  constructor(options?: FileFilterOptions) {
    this.maxSizeBytes = options?.maxSizeBytes ?? 5 * 1024 * 1024; // 5MB
    this.excludedDirectories = new Set(
      (options?.excludedDirectories ?? RepositoryFileFilter.DEFAULT_EXCLUDED_DIRECTORIES).map((d) => d.toLowerCase())
    );
    this.excludedExtensions = new Set(
      (options?.excludedExtensions ?? RepositoryFileFilter.DEFAULT_EXCLUDED_EXTENSIONS).map((e) =>
        e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`
      )
    );
    this.includedExtensions = options?.includedExtensions
      ? new Set(
          options.includedExtensions.map((e) => (e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`))
        )
      : null;
  }

  public shouldIncludeFile(filePath: string, size?: number): boolean {
    if (!filePath || filePath.trim() === '') {
      return false;
    }

    const normalizedPath = filePath.replace(/\\/g, '/');

    // 1. Check directory exclusions
    const segments = normalizedPath.split('/');
    for (const segment of segments) {
      if (this.excludedDirectories.has(segment.toLowerCase())) {
        return false;
      }
    }

    // 2. Check file size
    if (size !== undefined && size > this.maxSizeBytes) {
      return false;
    }

    // 3. Check file extension
    const ext = path.extname(normalizedPath).toLowerCase();

    // Excluded extensions check
    if (ext && this.excludedExtensions.has(ext)) {
      return false;
    }

    // Included extensions whitelist check (if specified)
    if (this.includedExtensions && this.includedExtensions.size > 0) {
      if (!ext || !this.includedExtensions.has(ext)) {
        return false;
      }
    }

    return true;
  }

  public isBinaryFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.excludedExtensions.has(ext);
  }

  public detectLanguage(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();
    return RepositoryFileFilter.EXTENSION_TO_LANGUAGE[ext] || null;
  }
}
