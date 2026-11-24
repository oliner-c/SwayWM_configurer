export type ConfigFileId = 'sway/config' | 'waybar/config.jsonc' | 'waybar/style.css';

export type ConfigBundle = Record<ConfigFileId, string>;

export interface GitCommit {
  hash: string;
  parentHash: string | null;
  branch: string;
  message: string;
  author: string;
  timestamp: number;
  files: ConfigBundle;
}

export interface GitRepoState {
  currentBranch: string;
  branches: Record<string, string>; // branchName -> head commit hash
  commits: Record<string, GitCommit>; // hash -> GitCommit
  authorName: string;
  authorEmail: string;
}

export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  lineNumberOld: number | null;
  lineNumberNew: number | null;
  text: string;
}

export interface DiffResult {
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
  isDirty: boolean;
}

export interface BundleDiffResult {
  files: Record<ConfigFileId, DiffResult>;
  totalAdded: number;
  totalRemoved: number;
  isDirty: boolean;
}

/**
 * Pure TypeScript synchronous SHA-1 implementation compatible with Git blob/commit hashing.
 */
export function sha1Hex(input: string): string {
  const utf8 = new TextEncoder().encode(input);
  const bitLen = utf8.length * 8;
  const paddedLen = Math.ceil((utf8.length + 9) / 64) * 64;
  const bytes = new Uint8Array(paddedLen);
  bytes.set(utf8);
  bytes[utf8.length] = 0x80;

  const view = new DataView(bytes.buffer);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Uint32Array(80);
  const rotl = (n: number, s: number) => (n << s) | (n >>> (32 - s));

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 80; i++) {
      w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i++) {
      let f = 0;
      let k = 0;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (rotl(a, 5) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30) >>> 0;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  return [h0, h1, h2, h3, h4]
    .map((n) => n.toString(16).padStart(8, '0'))
    .join('');
}

function computeGitCommitHash(
  parentHash: string | null,
  branch: string,
  message: string,
  timestamp: number,
  files: ConfigBundle
): string {
  const treePayload = (Object.keys(files) as ConfigFileId[])
    .sort()
    .map((key) => {
      const content = files[key];
      const blobHash = sha1Hex(`blob ${new TextEncoder().encode(content).length}\0${content}`);
      return `${key}:${blobHash}`;
    })
    .join('\n');
  const treeHash = sha1Hex(`tree ${treePayload.length}\0${treePayload}`);
  const payload = `tree ${treeHash}\nparent ${parentHash ?? 'root'}\nbranch ${branch}\ntime ${timestamp}\n\n${message}`;
  return sha1Hex(`commit ${payload.length}\0${payload}`);
}

export function createInitialRepo(
  initialFiles: ConfigBundle,
  initialMessage = 'Инициализация связки SwayWM + Waybar',
  timestamp = Date.now()
): GitRepoState {
  const filesCopy = { ...initialFiles };
  const hash = computeGitCommitHash(null, 'main', initialMessage, timestamp, filesCopy);
  const initialCommit: GitCommit = {
    hash,
    parentHash: null,
    branch: 'main',
    message: initialMessage,
    author: 'sway-user',
    timestamp,
    files: filesCopy,
  };
  return {
    currentBranch: 'main',
    branches: { main: hash },
    commits: { [hash]: initialCommit },
    authorName: 'sway-user',
    authorEmail: 'user@swaywm.local',
  };
}

export function getHeadCommit(repo: GitRepoState): GitCommit | null {
  const headHash = repo.branches[repo.currentBranch];
  return headHash ? repo.commits[headHash] ?? null : null;
}

export function getBranchHistory(repo: GitRepoState, branch = repo.currentBranch): GitCommit[] {
  const list: GitCommit[] = [];
  let cursor: string | null = repo.branches[branch] ?? null;
  const visited = new Set<string>();
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const commit: GitCommit | undefined = repo.commits[cursor];
    if (!commit) break;
    list.push(commit);
    cursor = commit.parentHash;
  }
  return list;
}

export function commitChanges(
  repo: GitRepoState,
  workingFiles: ConfigBundle,
  message: string,
  timestamp = Date.now()
): { repo: GitRepoState; commit: GitCommit } {
  const cleanMessage = message.trim() || 'Обновление конфигурации Sway + Waybar';
  const parentHash = repo.branches[repo.currentBranch] ?? null;
  const filesCopy = { ...workingFiles };
  const hash = computeGitCommitHash(
    parentHash,
    repo.currentBranch,
    cleanMessage,
    timestamp,
    filesCopy
  );

  const commit: GitCommit = {
    hash,
    parentHash,
    branch: repo.currentBranch,
    message: cleanMessage,
    author: repo.authorName,
    timestamp,
    files: filesCopy,
  };

  return {
    repo: {
      ...repo,
      branches: {
        ...repo.branches,
        [repo.currentBranch]: hash,
      },
      commits: {
        ...repo.commits,
        [hash]: commit,
      },
    },
    commit,
  };
}

export function rollbackToCommit(
  repo: GitRepoState,
  targetCommitHash: string,
  mode: 'revert-commit' | 'reset-head' = 'revert-commit',
  timestamp = Date.now()
): { repo: GitRepoState; restoredFiles: ConfigBundle } {
  const target = repo.commits[targetCommitHash];
  if (!target) {
    throw new Error(`Коммит ${targetCommitHash} не найден.`);
  }

  const restoredFiles = { ...target.files };

  if (mode === 'reset-head') {
    return {
      repo: {
        ...repo,
        branches: {
          ...repo.branches,
          [repo.currentBranch]: targetCommitHash,
        },
      },
      restoredFiles,
    };
  }

  const shortHash = targetCommitHash.slice(0, 7);
  const { repo: nextRepo } = commitChanges(
    repo,
    restoredFiles,
    `Откат к версии ${shortHash}: ${target.message}`,
    timestamp
  );
  return {
    repo: nextRepo,
    restoredFiles,
  };
}

export function createBranch(repo: GitRepoState, branchName: string): GitRepoState {
  const clean = branchName.trim().replace(/\s+/g, '-');
  if (!clean) throw new Error('Укажите имя ветки.');
  if (repo.branches[clean]) throw new Error(`Ветка «${clean}» уже существует.`);
  const headHash = repo.branches[repo.currentBranch];
  return {
    ...repo,
    currentBranch: clean,
    branches: {
      ...repo.branches,
      [clean]: headHash,
    },
  };
}

export function switchBranch(
  repo: GitRepoState,
  branchName: string
): { repo: GitRepoState; files: ConfigBundle } {
  const headHash = repo.branches[branchName];
  if (!headHash || !repo.commits[headHash]) {
    throw new Error(`Ветка «${branchName}» не найдена.`);
  }
  return {
    repo: {
      ...repo,
      currentBranch: branchName,
    },
    files: { ...repo.commits[headHash].files },
  };
}

export function computeLineDiff(oldText: string, newText: string): DiffResult {
  if (oldText === newText) {
    const lines = oldText.split(/\r?\n/).map((text, idx) => ({
      type: 'unchanged' as const,
      lineNumberOld: idx + 1,
      lineNumberNew: idx + 1,
      text,
    }));
    return { lines, addedCount: 0, removedCount: 0, isDirty: false };
  }

  const a = oldText.split(/\r?\n/);
  const b = newText.split(/\r?\n/);
  const m = a.length;
  const n = b.length;

  const dp: Uint32Array[] = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
      }
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let addedCount = 0;
  let removedCount = 0;

  while (i < m && j < n) {
    if (a[i] === b[j]) {
      lines.push({
        type: 'unchanged',
        lineNumberOld: i + 1,
        lineNumberNew: j + 1,
        text: a[i],
      });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push({
        type: 'removed',
        lineNumberOld: i + 1,
        lineNumberNew: null,
        text: a[i],
      });
      removedCount++;
      i++;
    } else {
      lines.push({
        type: 'added',
        lineNumberOld: null,
        lineNumberNew: j + 1,
        text: b[j],
      });
      addedCount++;
      j++;
    }
  }

  while (i < m) {
    lines.push({ type: 'removed', lineNumberOld: i + 1, lineNumberNew: null, text: a[i] });
    removedCount++;
    i++;
  }
  while (j < n) {
    lines.push({ type: 'added', lineNumberOld: null, lineNumberNew: j + 1, text: b[j] });
    addedCount++;
    j++;
  }

  return {
    lines,
    addedCount,
    removedCount,
    isDirty: addedCount > 0 || removedCount > 0,
  };
}

export function computeBundleDiff(oldBundle: ConfigBundle, newBundle: ConfigBundle): BundleDiffResult {
  const fileIds: ConfigFileId[] = ['sway/config', 'waybar/config.jsonc', 'waybar/style.css'];
  const files = {} as Record<ConfigFileId, DiffResult>;
  let totalAdded = 0;
  let totalRemoved = 0;

  for (const id of fileIds) {
    const diff = computeLineDiff(oldBundle[id] ?? '', newBundle[id] ?? '');
    files[id] = diff;
    totalAdded += diff.addedCount;
    totalRemoved += diff.removedCount;
  }

  return {
    files,
    totalAdded,
    totalRemoved,
    isDirty: totalAdded > 0 || totalRemoved > 0,
  };
}

export function generateGitRestoreScript(repo: GitRepoState): string {
  const history = getBranchHistory(repo).slice().reverse();
  const lines: string[] = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    '# Восстановление связки SwayWM + Waybar и полной Git-истории',
    'TARGET_DIR="${1:-$HOME/.config}"',
    'mkdir -p "$TARGET_DIR/sway" "$TARGET_DIR/waybar"',
    'cd "$TARGET_DIR"',
    'if [ ! -d .git ]; then git init -b ' + repo.currentBranch + '; fi',
    '',
    'git fast-import --quiet <<\'__SWAYFORGE_FAST_IMPORT__\'',
  ];

  const fileIds: ConfigFileId[] = ['sway/config', 'waybar/config.jsonc', 'waybar/style.css'];

  history.forEach((commit, idx) => {
    const mark = idx + 1;
    const epochSec = Math.floor(commit.timestamp / 1000);
    const msgBytes = new TextEncoder().encode(commit.message);
    lines.push(`commit refs/heads/${repo.currentBranch}`);
    lines.push(`mark :${mark}`);
    lines.push(`committer ${repo.authorName} <${repo.authorEmail}> ${epochSec} +0000`);
    lines.push(`data ${msgBytes.length}`);
    lines.push(commit.message);
    if (idx > 0) {
      lines.push(`from :${mark - 1}`);
    }
    for (const fileId of fileIds) {
      const content = commit.files[fileId] ?? '';
      const dataBytes = new TextEncoder().encode(content);
      lines.push(`M 100644 inline ${fileId}`);
      lines.push(`data ${dataBytes.length}`);
      lines.push(content);
    }
    lines.push('');
  });

  lines.push('__SWAYFORGE_FAST_IMPORT__');
  lines.push(`git checkout -f ${repo.currentBranch}`);
  lines.push('echo "Готово! Sway + Waybar и Git-история восстановлены в $TARGET_DIR"');

  return lines.join('\n');
}
