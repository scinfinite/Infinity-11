export type CiProvider = 'github-actions' | 'generic';
export type CiStatus = 'queued' | 'in_progress' | 'success' | 'failure' | 'cancelled' | 'skipped';
export type FailureKind =
  | 'compile'
  | 'lint'
  | 'test'
  | 'build'
  | 'security'
  | 'dependency'
  | 'environment'
  | 'timeout'
  | 'unknown';
export type FailureSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CiRunRef {
  provider: CiProvider;
  repository: { owner: string; name: string };
  workflow: string;
  runId: string;
  commitSha: string;
  status: CiStatus;
}

export interface CiJobResult {
  jobId: string;
  name: string;
  status: CiStatus;
  conclusion?: Exclude<CiStatus, 'queued' | 'in_progress'>;
  durationMs?: number;
  log?: string;
}

export interface CiFailure {
  jobId: string;
  kind: FailureKind;
  severity: FailureSeverity;
  fingerprint: string;
  summary: string;
  evidence: string[];
}

export interface CiAnalysis {
  run: CiRunRef;
  jobs: CiJobResult[];
  failures: CiFailure[];
  passed: boolean;
  fingerprint: string;
}

export interface CiAdapter {
  getRun(run: CiRunRef): Promise<CiRunRef>;
  getJobs(run: CiRunRef): Promise<CiJobResult[]>;
}

export interface CiAnalysisInput {
  adapter: CiAdapter;
  maxLogBytes?: number;
}

const shaPattern = /^[0-9a-f]{7,64}$/i;
const idPattern = /^[A-Za-z0-9._:-]{1,128}$/;

function normalizeLog(log: string, maxLogBytes: number): string {
  return log
    .slice(0, maxLogBytes)
    .replace(/\b[0-9a-f]{7,64}\b/gi, '<sha>')
    .replace(/\b\d{4}-\d{2}-\d{2}T[^\s]+\b/g, '<timestamp>')
    .replace(/\s+/g, ' ')
    .trim();
}

function hash(input: string): string {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, '0');
}

function classify(job: CiJobResult): {
  kind: FailureKind;
  severity: FailureSeverity;
  summary: string;
} {
  const text = normalizeLog(`${job.name} ${job.log ?? ''}`.toLowerCase(), 16_384);
  if (job.status === 'cancelled' || /timeout|timed out|deadline exceeded/.test(text)) {
    return {
      kind: 'timeout',
      severity: 'high',
      summary: 'CI execution timed out or was cancelled.',
    };
  }
  if (/gitleaks|secret|vulnerability|cve|security audit|audit failed/.test(text)) {
    return { kind: 'security', severity: 'critical', summary: 'A security verification failed.' };
  }
  if (/dependency|lockfile|pnpm install|npm install|resolution/.test(text)) {
    return {
      kind: 'dependency',
      severity: 'high',
      summary: 'A dependency or lockfile step failed.',
    };
  }
  if (/lint|eslint|prettier|format/.test(text)) {
    return { kind: 'lint', severity: 'medium', summary: 'A formatting or linting step failed.' };
  }
  if (/test|vitest|jest|assert|expect\(/.test(text)) {
    return { kind: 'test', severity: 'high', summary: 'A test verification step failed.' };
  }
  if (/tsc|typecheck|type error|cannot find module|syntaxerror|compile/.test(text)) {
    return {
      kind: 'compile',
      severity: 'high',
      summary: 'Compilation or type verification failed.',
    };
  }
  if (/build|bundl|vite|next build/.test(text)) {
    return { kind: 'build', severity: 'high', summary: 'The application build failed.' };
  }
  if (/runner|network|enoent|econn|permission denied|out of memory/.test(text)) {
    return {
      kind: 'environment',
      severity: 'high',
      summary: 'The CI environment or infrastructure failed.',
    };
  }
  return {
    kind: 'unknown',
    severity: 'medium',
    summary: 'CI failed without a recognized failure signature.',
  };
}

export function validateCiRun(run: CiRunRef): string[] {
  const errors: string[] = [];
  if (!run.repository.owner || !idPattern.test(run.repository.owner)) errors.push('INVALID_OWNER');
  if (!run.repository.name || !idPattern.test(run.repository.name))
    errors.push('INVALID_REPOSITORY');
  if (!run.workflow || !idPattern.test(run.workflow)) errors.push('INVALID_WORKFLOW');
  if (!idPattern.test(run.runId)) errors.push('INVALID_RUN_ID');
  if (!shaPattern.test(run.commitSha)) errors.push('INVALID_COMMIT_SHA');
  return errors;
}

export async function analyzeCiRun(run: CiRunRef, input: CiAnalysisInput): Promise<CiAnalysis> {
  const errors = validateCiRun(run);
  if (errors.length) throw new Error(`INVALID_CI_RUN: ${errors.join(', ')}`);
  const maxLogBytes = input.maxLogBytes ?? 32_768;
  if (!Number.isInteger(maxLogBytes) || maxLogBytes < 1024 || maxLogBytes > 1_048_576) {
    throw new Error('INVALID_MAX_LOG_BYTES');
  }

  const currentRun = await input.adapter.getRun(run);
  if (currentRun.commitSha !== run.commitSha || currentRun.runId !== run.runId) {
    throw new Error('STALE_RUN: CI run identity changed during analysis.');
  }
  const jobs = (await input.adapter.getJobs(currentRun))
    .slice()
    .sort((a, b) => a.jobId.localeCompare(b.jobId));
  const failures: CiFailure[] = [];
  for (const job of jobs) {
    if (job.status === 'success' || job.status === 'skipped') continue;
    const classification = classify(job);
    const normalized = normalizeLog(job.log ?? job.name, maxLogBytes);
    failures.push({
      jobId: job.jobId,
      kind: classification.kind,
      severity: classification.severity,
      fingerprint: hash(`${classification.kind}:${normalized}`),
      summary: classification.summary,
      evidence: normalized ? [normalized] : [job.name],
    });
  }
  const fingerprint = hash(
    JSON.stringify(
      failures.map((failure) => ({
        jobId: failure.jobId,
        kind: failure.kind,
        fingerprint: failure.fingerprint,
      })),
    ),
  );
  return { run: currentRun, jobs, failures, passed: failures.length === 0, fingerprint };
}
