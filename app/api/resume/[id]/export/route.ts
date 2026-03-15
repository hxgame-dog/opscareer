import { NextRequest } from 'next/server';
import { jsPDF } from 'jspdf';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { getResumeTheme } from '@/lib/resume-themes';
import { fail } from '@/lib/response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const format = req.nextUrl.searchParams.get('format') ?? 'md';
    const user = await requireCurrentUser();
    const resume = await prisma.resume.findUnique({ where: { id } });

    if (!resume || resume.userId !== user.id) {
      return fail('Resume not found.', 404);
    }

    if (format === 'pdf') {
      const doc = new jsPDF();
      const theme = getResumeTheme(resume.theme);
      const lines = doc.splitTextToSize(resume.markdown, 180);
      doc.setFillColor(theme.accentColor);
      doc.rect(0, 0, 210, 24, 'F');
      doc.setTextColor('#ffffff');
      doc.setFont(theme.fontFamily.toLowerCase() as 'times' | 'courier' | 'helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(resume.title, 15, 15);
      doc.setTextColor('#222222');
      doc.setFont(theme.fontFamily.toLowerCase() as 'times' | 'courier' | 'helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(lines, 15, 34);
      const buffer = doc.output('arraybuffer');

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${resume.title}.pdf"`
        }
      });
    }

    return new Response(resume.markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${resume.title}.md"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}
