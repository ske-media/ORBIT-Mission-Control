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

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isSignUp) {
        // Validate name field for sign up
        if (!name.trim()) {
          setError('Le nom est requis');
          return;
        }
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion');
      console.error('Auth error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-black p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-nebula-purple rounded-full flex items-center justify-center mb-4">
            <Rocket className="text-star-white" size={32} />
          </div>
          <h1 className="text-3xl font-orbitron text-star-white">Orbit Mission Control</h1>
          <p className="text-moon-gray mt-2">Centralisez la gestion des projets de votre agence</p>
        </div>

        <div className="bg-deep-space rounded-xl shadow-lg border border-white/10 overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-orbitron text-star-white mb-6">
              {isSignUp ? 'Créer un compte' : 'Connexion'}
            </h2>

            {error && (
              <div className="bg-red-alert/10 text-red-alert p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
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
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm text-moon-gray mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                  placeholder="you@example.com"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm text-moon-gray mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Chargement...' : isSignUp ? 'Créer un compte' : 'Se connecter'}
              </Button>
            </form>
          </div>

          <div className="px-8 py-4 bg-space-black/30 border-t border-white/5 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-nebula-purple hover:text-nebula-purple-light text-sm transition-colors"
            >
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;