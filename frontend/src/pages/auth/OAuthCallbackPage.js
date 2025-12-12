import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/common/Alert';

const OAuthCallbackPage = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: auth0Loading, user: auth0User } = useAuth0();
  const { setToken, setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent double processing
      if (hasProcessed.current) return;

      // Wait for Auth0 to finish loading
      if (auth0Loading) return;

      // Check if Auth0 authentication succeeded
      if (!isAuthenticated || !auth0User) {
        setError('Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      hasProcessed.current = true;

      try {
        // Send Auth0 user info to our backend
        const API_URL = process.env.REACT_APP_API_URL || '';
        const res = await fetch(`${API_URL}/auth/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: auth0User.email,
            sub: auth0User.sub,
            emailVerified: auth0User.email_verified,
            name: auth0User.name
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'OAuth authentication failed');
        }

        // Check if user needs to set password first
        if (data.needsPasswordSetup) {
          navigate(`/set-password?token=${data.resetToken}&utorid=${data.utorid}`);
          return;
        }

        // Store token and redirect
        localStorage.setItem('authToken', data.token);

        // Update AuthContext
        if (setToken) setToken(data.token);
        if (setUser) setUser(data.user);

        navigate('/');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    handleCallback();
  }, [isAuthenticated, auth0Loading, auth0User, navigate, setToken, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
          <Alert type="error">{error}</Alert>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-lg hover:from-brand-600 hover:to-brand-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallbackPage;
