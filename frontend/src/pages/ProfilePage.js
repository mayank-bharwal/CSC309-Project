import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadcrumb';
import ComponentCard from '../components/common/ComponentCard';

const API_URL = process.env.REACT_APP_API_URL || '';

// Password validation helper
const validateNewPassword = (pw) => {
  const errors = [];

  if (pw.length < 8 || pw.length > 20) {
    errors.push("Password must be 8–20 characters long");
  }
  if (!/[A-Z]/.test(pw)) {
    errors.push("Must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(pw)) {
    errors.push("Must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(pw)) {
    errors.push("Must contain at least one number");
  }
  if (!/[^A-Za-z0-9]/.test(pw)) {
    errors.push("Must contain at least one special character");
  }

  return errors;
};

const ProfilePage = () => {
  const { user, token, refreshUser } = useAuth();

  // PROFILE EDIT FIELDS
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // PASSWORD MODAL FIELDS
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // Single-source message state
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      setMessage('Profile updated successfully.');
      await refreshUser();

    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMessage("");

    if (!currentPw || !newPw) {
      setPasswordMessage("Both old and new passwords are required");
      return;
    }

    if (newPw !== confirmPw) {
      setPasswordMessage("New passwords do not match");
      return;
    }

    const pwErrors = validateNewPassword(newPw);
    if (pwErrors.length > 0) {
      setPasswordMessage(pwErrors.join(". "));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/me/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old: currentPw,
          new: newPw,
        }),
      });

      if (res.status === 403) {
        setPasswordMessage("Current password is incorrect");
        return;
      }

      if (!res.ok) {
        const errText = await res.text();
        setPasswordMessage(errText || "Failed to update password");
        return;
      }

      setPasswordMessage("Password updated successfully!");

      // Reset fields & close modal
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      }, 800);

    } catch (err) {
      setPasswordMessage("Network error — backend may be offline");
    }
  };


  return (
    <>
      <PageMeta title="Profile" description="Manage your account settings" />
      <PageBreadcrumb pageTitle="Profile" />

      {/* EDIT PROFILE */}
      <ComponentCard title="Edit Profile" desc="Update your personal information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Name */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

        </div>

        {message && (
          <p className="mt-4 text-sm font-medium text-brand-600 dark:text-brand-400">
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 px-6 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </ComponentCard>

      {/* CHANGE PASSWORD */}
      <ComponentCard title="Change Password" desc="Update your account password" className="mt-8">
        <button
          onClick={() => {
            setPasswordMessage("");
            setShowPasswordModal(true);
          }}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg dark:bg-gray-600 hover:opacity-90"
        >
          Change Password
        </button>

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg border dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Change Password
              </h2>

              {/* Current Password */}
              <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">
                Current Password
              </label>
              <input
                type="password"
                className="w-full mb-3 p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />

              {/* New Password */}
              <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">
                New Password
              </label>
              <input
                type="password"
                className="w-full mb-3 p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />

              {/* Confirm Password */}
              <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                type="password"
                className="w-full mb-3 p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />

              {/* ONE unified message */}
              {passwordMessage && (
                <p className="text-sm mb-2 text-brand-600 dark:text-brand-400">
                  {passwordMessage}
                </p>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  Cancel
                </button>

                <button
                  onClick={handlePasswordChange}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </ComponentCard>
    </>
  );
};

export default ProfilePage;