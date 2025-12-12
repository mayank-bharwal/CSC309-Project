import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import PageMeta from '../../components/common/PageMeta';
import Alert from '../../components/common/Alert';

const SetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const utorid = searchParams.get('utorid');

  useEffect(() => {
    if (!token || !utorid) {
      setError('Invalid password setup link. Please request a new one.');
    }
  }, [token, utorid]);

  const validatePassword = (pwd) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token || !utorid) {
      setError('Invalid password setup link');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be 8-20 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || '';
      const res = await fetch(`${API_URL}/auth/resets/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ utorid, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to set password');
      }

      setSuccess('Password set successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password set successfully. You can now login.' } });
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;

    const checks = {
      length: password.length >= 8 && password.length <= 20,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    const strength = Object.values(checks).filter(Boolean).length;

    if (strength < 3) return { text: 'Weak', color: 'text-red-500', bg: 'bg-red-500' };
    if (strength < 5) return { text: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { text: 'Strong', color: 'text-green-500', bg: 'bg-green-500' };
  };

  const strength = getPasswordStrength();

  return (
    <>
      <PageMeta title="Set Password" description="Set your account password" />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm z-10"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-brand-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white text-2xl font-bold mb-4">
              LP
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Set Your Password</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {utorid ? `Create a password for ${utorid}` : 'Create a secure password for your account'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/20 p-8 shadow-xl">
            {error && (
              <div className="mb-6">
                <Alert type="error">{error}</Alert>
              </div>
            )}

            {success && (
              <div className="mb-6">
                <Alert type="success">{success}</Alert>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                    placeholder="Enter your password"
                    required
                    disabled={!token || !utorid}
                  />
                  {password && strength && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${strength.color}`}>
                          {strength.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`${strength.bg} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${(Object.values({
                            length: password.length >= 8 && password.length <= 20,
                            lowercase: /[a-z]/.test(password),
                            uppercase: /[A-Z]/.test(password),
                            number: /\d/.test(password),
                            special: /[@$!%*?&]/.test(password),
                          }).filter(Boolean).length / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                    placeholder="Confirm your password"
                    required
                    disabled={!token || !utorid}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    Password Requirements:
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    <li className="flex items-center">
                      <span className={`mr-2 ${password.length >= 8 && password.length <= 20 ? 'text-green-500' : 'text-gray-400'}`}>
                        {password.length >= 8 && password.length <= 20 ? '✓' : '○'}
                      </span>
                      8-20 characters long
                    </li>
                    <li className="flex items-center">
                      <span className={`mr-2 ${/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                        {/[a-z]/.test(password) ? '✓' : '○'}
                      </span>
                      At least one lowercase letter
                    </li>
                    <li className="flex items-center">
                      <span className={`mr-2 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                        {/[A-Z]/.test(password) ? '✓' : '○'}
                      </span>
                      At least one uppercase letter
                    </li>
                    <li className="flex items-center">
                      <span className={`mr-2 ${/\d/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                        {/\d/.test(password) ? '✓' : '○'}
                      </span>
                      At least one number
                    </li>
                    <li className="flex items-center">
                      <span className={`mr-2 ${/[@$!%*?&]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                        {/[@$!%*?&]/.test(password) ? '✓' : '○'}
                      </span>
                      At least one special character (@$!%*?&)
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token || !utorid}
                  className="w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-lg hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Setting Password...' : 'Set Password'}
                </button>
              </form>
            )}

            {!success && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-brand-400 hover:text-brand-300"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SetPasswordPage;
