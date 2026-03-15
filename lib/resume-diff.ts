import { ResumeDiffResult, ResumeDraft } from '@/types/domain';

function diffList(before: string[], after: string[]) {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);

  return {
    added: after.filter((item) => !beforeSet.has(item)),
    removed: before.filter((item) => !afterSet.has(item)),
    unchanged: after.filter((item) => beforeSet.has(item))
  };
}

export function buildResumeDiff(before: ResumeDraft, after: ResumeDraft): ResumeDiffResult {
  const beforeExperiences = new Map(
    before.experiences.map((item) => [`${item.company}::${item.role}`, item.bullets])
  );
  const afterExperiences = new Map(
    after.experiences.map((item) => [`${item.company}::${item.role}`, item.bullets])
  );
  const expKeys = [...new Set([...beforeExperiences.keys(), ...afterExperiences.keys()])];

  const beforeProjects = new Map(before.projects.map((item) => [item.name, item.bullets]));
  const afterProjects = new Map(after.projects.map((item) => [item.name, item.bullets]));
  const projectKeys = [...new Set([...beforeProjects.keys(), ...afterProjects.keys()])];

  return {
    summary: {
      before: before.summary,
      after: after.summary
    },
    skills: diffList(before.skills, after.skills),
    experiences: expKeys.map((key) => {
      const [company, role] = key.split('::');
      const result = diffList(beforeExperiences.get(key) ?? [], afterExperiences.get(key) ?? []);
      return {
        company,
        role,
        addedBullets: result.added,
        removedBullets: result.removed
      };
    }),
    projects: projectKeys.map((name) => {
      const result = diffList(beforeProjects.get(name) ?? [], afterProjects.get(name) ?? []);
      return {
        name,
        addedBullets: result.added,
        removedBullets: result.removed
      };
    })
  };
}
