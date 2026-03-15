'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

type Mode = 'signin' | 'signup';

export function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('用一个账号管理你自己的简历、岗位和面试记录。');
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    try {
      if (mode === 'signup') {
        const registerRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const registerJson = await registerRes.json();
        if (!registerJson.success) {
          throw new Error(registerJson.error ?? '注册失败');
        }
      }

      const login = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (login?.error) {
        throw new Error('邮箱或密码错误');
      }

      window.location.href = '/';
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '认证失败');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-copy">
        <p className="eyebrow">Secure Workspace</p>
        <h1>把求职资料放回你自己的账号里</h1>
        <p>现在开始，每个用户的 Gemini Key、简历版本、岗位 JD 和面试记录都只属于自己的工作区。</p>
        <div className="auth-note">{message}</div>
      </div>

      <div className="auth-card">
        <div className="auth-switch">
          <button className={mode === 'signin' ? 'active-switch' : ''} onClick={() => setMode('signin')}>
            登录
          </button>
          <button className={mode === 'signup' ? 'active-switch' : ''} onClick={() => setMode('signup')}>
            注册
          </button>
        </div>

        {mode === 'signup' ? (
          <>
            <label>姓名</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的名字" />
          </>
        ) : null}

        <label>邮箱</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <label>密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="至少 8 位"
        />

        <button onClick={submit} disabled={pending}>
          {pending ? '提交中...' : mode === 'signin' ? '登录工作台' : '创建账号并登录'}
        </button>
      </div>
    </section>
  );
}
