import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [{ title: 'Owner sign in | First Shine Furniture' }, { name: 'description', content: 'Sign in to manage the First Shine Furniture website.' }, { property: 'og:title', content: 'Owner sign in | First Shine Furniture' }, { property: 'og:description', content: 'Owner area.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email')), password = String(fd.get('password'));
    setBusy(true); setMsg('');
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg(error.message);
      navigate({ to: '/admin' });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setBusy(false);
      setMsg(error ? error.message : 'Check your email to confirm your account, then sign in.');
    }
  }
  return <main className="section auth-page"><h1>{mode === 'in' ? 'Owner sign in' : 'Create owner account'}</h1><p className="note">The first account created becomes the site administrator.</p><form onSubmit={submit} className="enquiry-form"><div className="field"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div><div className="field"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} /></div>{msg && <p role="status" className="note">{msg}</p>}<Button type="submit" size="lg" disabled={busy}>{mode === 'in' ? 'Sign in' : 'Create account'}</Button><Button type="button" variant="ghost" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Need an account? Create one' : 'Have an account? Sign in'}</Button></form></main>;
}
