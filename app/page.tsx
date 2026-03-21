import { getServerSession } from 'next-auth';
import { Dashboard } from '@/app/components/dashboard';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { isWorkspaceView, type WorkspaceView } from '@/lib/workspace-ui';

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{ view?: string; resumeId?: string; generated?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = searchParams ? await searchParams : undefined;
  const initialView: WorkspaceView = params?.view && isWorkspaceView(params.view) ? params.view : 'home';

  if (!session?.user?.id) {
    redirect('/auth');
  }

  return (
    <Dashboard
      user={{
        id: session?.user?.id ?? '',
        name: session?.user?.name ?? '',
        email: session?.user?.email ?? ''
      }}
      initialView={initialView}
      initialResumeId={params?.resumeId ?? ''}
      initialResumeGenerated={params?.generated === '1'}
    />
  );
}
