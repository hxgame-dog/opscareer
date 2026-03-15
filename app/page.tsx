import { getServerSession } from 'next-auth';
import { Dashboard } from '@/app/components/dashboard';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

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
    />
  );
}
