import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, type Location } from 'react-router-dom';
import { AuthLayout } from '@/components/AuthLayout';
import { FormError, PasswordField, SubmitButton, TextField } from '@/components/fields';
import { useAuth } from '@/hooks/useAuth';
import { authErrorMessage } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';

export default function Connexion() {
  const { session } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (session) {
    const from = (location.state as { from?: Location } | null)?.from;
    const to = from ? `${from.pathname}${from.search}${from.hash}` : '/';
    return <Navigate to={to} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Renseigne ton email et ton mot de passe.');
      return;
    }
    setError(null);
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      setError(authErrorMessage(error));
      setPending(false);
    }
    // En cas de succès, AuthProvider reçoit la session et la redirection se fait au rendu.
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Retrouve ton espace."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-medium text-sky-700 hover:text-sky-800">
            Crée-le en une minute
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
        />
        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />
        <FormError message={error} />
        <SubmitButton pending={pending}>{pending ? 'Connexion…' : 'Se connecter'}</SubmitButton>
      </form>
    </AuthLayout>
  );
}
