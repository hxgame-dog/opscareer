import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ResumeBuilderPage } from '@/app/components/resume-builder-page';
import { authOptions } from '@/lib/auth-options';

export default async function ResumeBuilderRoute() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth');
  }

  return (
    <ResumeBuilderPage
      user={{
        id: session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? ''
      }}
    />
  );
}
