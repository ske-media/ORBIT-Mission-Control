import React, { useState } from 'react';
import { Rocket } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp, user, loading } = useAuth();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client‑side validation
    if (!email.trim() || !password) {
      setError('Veuillez renseigner un email et un mot de passe valides.');
      return;
    }
    if (isSignUp && !name.trim()) {
      setError('Le nom complet est requis pour la création de compte.');
      return;
    }

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password, name);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        // Supabase returns human‑readable messages
        switch (result.error.message) {
          case 'Invalid login credentials':
            setError('Email ou mot de passe incorrect.');
            break;
          case 'Email not confirmed':
            setError('Merci de confirmer votre adresse email. Vérifiez votre boîte de réception.');
            break;
          default:
            setError(result.error.message);
        }
        return;
      }
      // On successful login/signup, user is redirected by AuthContext
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setError('Une erreur inattendue est survenue. Veuillez réessayer plus tard.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-black p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-nebula-purple rounded-full flex items-center justify-center mb-4">
            <Rocket size={32} className="text-star-white" />
          </div>
          <h1 className="text-3xl font-orbitron text-star-white">
            Orbit Mission Control
          </h1>
          <p className="text-moon-gray mt-2">
            Centralisez la gestion des projets de votre agence
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-deep-space rounded-xl shadow-lg border border-white/10 overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-orbitron text-star-white mb-6">
              {isSignUp ? 'Créer un compte' : 'Connexion'}
            </h2>

            {/* Error Message */}
            {error && (
              <div className="bg-red-alert/10 text-red-alert border border-red-alert rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Name field only on sign-up */}
              {isSignUp && (
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm text-moon-gray mb-2">
                    Nom complet
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                  />
                </div>
              )}

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm text-moon-gray mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                />
              </div>

              {/* Password */}
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm text-moon-gray mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
              >
                {loading
                  ? 'Chargement...'
                  : isSignUp
                  ? 'Créer un compte'
                  : 'Se connecter'}
              </Button>
            </form>
          </div>

          {/* Toggle Sign-In / Sign-Up */}
          <div className="px-8 py-4 bg-space-black/30 border-t border-white/5 text-center">
            <button
              type="button"
              onClick={() => { setError(null); setIsSignUp(!isSignUp); }}
              className="text-nebula-purple hover:text-nebula-purple-light text-sm transition-colors"
            >
              {isSignUp
                ? 'Déjà un compte ? Se connecter'
                : "Pas de compte ? S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;