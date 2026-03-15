import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { AuthForm } from '@/app/components/auth-form';
import { authOptions } from '@/lib/auth-options';

export default async function AuthPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect('/');
  }

  return (
    <main className="auth-page">
      <AuthForm />
    </main>
  );
}
