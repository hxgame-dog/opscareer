import type { Profile } from '@prisma/client';
import type { ProfileInput } from '@/types/domain';

export const PROFILE_BASE_TITLE = 'Profile Base';

export function toProfileInputFromRow(row: Pick<Profile, 'basicsJson' | 'experienceJson' | 'projectsJson' | 'skillsJson' | 'educationJson' | 'language'>): ProfileInput {
  return {
    basics: JSON.parse(row.basicsJson) as ProfileInput['basics'],
    experiences: JSON.parse(row.experienceJson) as ProfileInput['experiences'],
    projects: JSON.parse(row.projectsJson) as ProfileInput['projects'],
    skills: JSON.parse(row.skillsJson) as ProfileInput['skills'],
    education: JSON.parse(row.educationJson) as ProfileInput['education'],
    language: (row.language as ProfileInput['language']) ?? 'zh-CN'
  };
}

export function toProfileRowData(profile: ProfileInput) {
  return {
    title: PROFILE_BASE_TITLE,
    basicsJson: JSON.stringify(profile.basics),
    experienceJson: JSON.stringify(profile.experiences),
    projectsJson: JSON.stringify(profile.projects),
    skillsJson: JSON.stringify(profile.skills),
    educationJson: JSON.stringify(profile.education),
    language: profile.language ?? 'zh-CN'
  };
}
