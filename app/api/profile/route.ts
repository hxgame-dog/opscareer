import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { toProfileInputFromRow, toProfileRowData, PROFILE_BASE_TITLE } from '@/lib/profile-record';
import { fail, ok } from '@/lib/response';

const ProfileSchema = z.object({
  basics: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    summary: z.string(),
    yearsOfExperience: z.number().optional()
  }),
  experiences: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      start: z.string(),
      end: z.string().optional(),
      achievements: z.array(z.string()),
      techStack: z.array(z.string()).optional()
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      role: z.string().optional(),
      summary: z.string(),
      highlights: z.array(z.string())
    })
  ),
  skills: z.array(z.string()),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      major: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional()
    })
  ),
  language: z.enum(['zh-CN', 'en-US']).optional()
});

async function findCurrentProfile(userId: string) {
  const profile =
    (await prisma.profile.findFirst({
      where: { userId, title: PROFILE_BASE_TITLE },
      orderBy: { updatedAt: 'desc' }
    })) ??
    (await prisma.profile.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    }));

  return profile;
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const profile = await findCurrentProfile(user.id);

    if (!profile) {
      return ok(null);
    }

    return ok({
      id: profile.id,
      title: profile.title,
      profile: toProfileInputFromRow(profile)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = z.object({ profile: ProfileSchema }).parse(await req.json());

    const current = await prisma.profile.findFirst({
      where: { userId: user.id, title: PROFILE_BASE_TITLE },
      orderBy: { updatedAt: 'desc' }
    });

    const rowData = toProfileRowData(body.profile);

    const profile = current
      ? await prisma.profile.update({
          where: { id: current.id },
          data: rowData
        })
      : await prisma.profile.create({
          data: {
            userId: user.id,
            ...rowData
          }
        });

    return ok({
      id: profile.id,
      title: profile.title,
      profile: toProfileInputFromRow(profile)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}
