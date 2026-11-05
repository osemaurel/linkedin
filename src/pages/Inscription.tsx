import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/AuthLayout';
import { FormError, PasswordField, SubmitButton, TextField } from '@/components/fields';
import { useAuth } from '@/hooks/useAuth';
import { ACCOUNT_EXISTS_MESSAGE, authErrorMessage } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Inscription() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Inscription sans confirmation d'email : la session arrive tout de suite,
  // on enchaîne sur le premier passage.
  if (session) return <Navigate to="/demarrer" replace />;

  if (sentTo) {
    return (
      <AuthLayout
        title="Vérifie ta boîte mail"
        subtitle={
          <>
            On vient d’envoyer un lien de confirmation à{' '}
            <strong className="font-medium text-slate-900">{sentTo}</strong>. Clique dessus pour
            activer ton compte, tu arriveras directement sur la suite.
          </>
        }
        footer={
          <>
            Rien reçu ? Regarde dans les spams, ou{' '}
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="font-medium text-sky-700 hover:text-sky-800"
            >
              corrige ton adresse
            </button>
            .
          </>
        }
      />
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError('Cette adresse email n’est pas valide.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Ton mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    setError(null);
    setPending(true);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { emailRedirectTo: `${window.location.origin}/demarrer` },
    });
    if (error) {
      setError(authErrorMessage(error));
      setPending(false);
      return;
    }
    if (data.session) return;
    // Avec la confirmation d'email activée, Supabase renvoie un utilisateur sans
    // identité au lieu d'une erreur quand l'adresse est déjà prise.
    if (data.user?.identities?.length === 0) {
      setError(ACCOUNT_EXISTS_MESSAGE);
      setPending(false);
      return;
    }
    setSentTo(cleanEmail);
    setPending(false);
  }

  return (
    <AuthLayout
      title="Créer ton compte"
      subtitle="Ton email et un mot de passe. Le reste, on le déduit de ton profil."
      footer={
        <>
          Déjà un compte ?{' '}
          <Link to="/connexion" className="font-medium text-sky-700 hover:text-sky-800">
            Connecte-toi
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
          autoComplete="new-password"
          hint={`${MIN_PASSWORD_LENGTH} caractères minimum.`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />
        <FormError message={error} />
        <SubmitButton pending={pending}>
          {pending ? 'Création du compte…' : 'Créer mon compte'}
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
