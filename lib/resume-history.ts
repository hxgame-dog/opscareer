import { ResumeTheme } from '@/types/domain';

type ResumeRecord = {
  id: string;
  title: string;
  version: number;
  isPrimary: boolean;
  theme: ResumeTheme;
  parentResumeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  jobPosting: null | {
    company: string;
    role: string;
  };
};

export type ResumeHistoryGroup = {
  rootResumeId: string;
  displayTitle: string;
  latestResumeId: string;
  versionCount: number;
  updatedAt: string;
  versions: Array<{
    id: string;
    title: string;
    version: number;
    theme: ResumeTheme;
    isPrimary: boolean;
    parentResumeId: string | null;
    createdAt: string;
    updatedAt: string;
    targetLabel: string | null;
  }>;
};

export function buildResumeHistoryGroups(resumes: ResumeRecord[]): ResumeHistoryGroup[] {
  const byId = new Map(resumes.map((resume) => [resume.id, resume]));
  const groups = new Map<string, ResumeRecord[]>();

  const findRootId = (resume: ResumeRecord) => {
    let current: ResumeRecord = resume;
    const visited = new Set<string>();

    while (current.parentResumeId && byId.has(current.parentResumeId) && !visited.has(current.parentResumeId)) {
      visited.add(current.id);
      current = byId.get(current.parentResumeId)!;
    }

    return current.id;
  };

  for (const resume of resumes) {
    const rootId = findRootId(resume);
    const existing = groups.get(rootId) ?? [];
    existing.push(resume);
    groups.set(rootId, existing);
  }

  return [...groups.entries()]
    .map(([rootResumeId, items]) => {
      const versions = [...items].sort((a, b) => b.version - a.version || +b.updatedAt - +a.updatedAt);
      const latest = versions[0];
      const root = byId.get(rootResumeId) ?? latest;

      return {
        rootResumeId,
        displayTitle: root.title,
        latestResumeId: latest.id,
        versionCount: versions.length,
        updatedAt: latest.updatedAt.toISOString(),
        versions: versions.map((resume) => ({
          id: resume.id,
          title: resume.title,
          version: resume.version,
          theme: resume.theme,
          isPrimary: resume.isPrimary,
          parentResumeId: resume.parentResumeId,
          createdAt: resume.createdAt.toISOString(),
          updatedAt: resume.updatedAt.toISOString(),
          targetLabel: resume.jobPosting ? `${resume.jobPosting.company} · ${resume.jobPosting.role}` : null
        }))
      };
    })
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}
