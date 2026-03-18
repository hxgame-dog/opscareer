import { NextRequest } from 'next/server';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { ResumeImportPreviewSchema, normalizeResumeImportPreview } from '@/lib/resume-import';
import { fail, ok } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const payload = ResumeImportPreviewSchema.parse(await req.json());
    const preview = normalizeResumeImportPreview(payload);

    const profileRow = await prisma.profile.create({
      data: {
        userId: user.id,
        title: `${preview.title}-Imported Profile`,
        basicsJson: JSON.stringify(preview.profile.basics),
        experienceJson: JSON.stringify(preview.profile.experiences),
        projectsJson: JSON.stringify(preview.profile.projects),
        skillsJson: JSON.stringify(preview.profile.skills),
        educationJson: JSON.stringify(preview.profile.education),
        language: preview.language
      }
    });

    const resumeRow = await prisma.resume.create({
      data: {
        userId: user.id,
        profileId: profileRow.id,
        title: preview.title,
        contentJson: JSON.stringify(preview.draft),
        markdown: preview.markdown,
        language: preview.language,
        theme: preview.theme
      }
    });

    return ok({
      resumeId: resumeRow.id,
      profileId: profileRow.id,
      title: resumeRow.title,
      markdown: resumeRow.markdown,
      theme: resumeRow.theme,
      draft: preview.draft,
      profile: preview.profile
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}
