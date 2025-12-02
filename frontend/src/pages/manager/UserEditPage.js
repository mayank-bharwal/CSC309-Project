import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadcrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const UserEditPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isSuperuser } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(false);
  const [suspicious, setSuspicious] = useState(false);
  const [role, setRole] = useState('');

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.get(`/users/${userId}`);
        setUser(data);
        setEmail(data.email || '');
        setVerified(data.verified || false);
        setSuspicious(data.suspicious || false);
        setRole(data.role || 'regular');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const changes = {};
    if (email !== user.email) changes.email = email;
    if (verified !== user.verified) changes.verified = verified;
    if (suspicious !== user.suspicious) changes.suspicious = suspicious;
    if (role !== user.role) changes.role = role;

    if (Object.keys(changes).length === 0) {
      setError('No changes to save');
      return;
    }

    // If promoting to manager/superuser, show confirmation
    if (changes.role && (changes.role === 'manager' || changes.role === 'superuser')) {
      setPendingChanges(changes);
      setShowConfirmModal(true);
      return;
    }

    await saveChanges(changes);
  };

  const saveChanges = async (changes) => {
    setSaving(true);
    setError('');

    try {
      const data = await api.patch(`/users/${userId}`, changes);
      setUser((prev) => ({ ...prev, ...data }));
      setSuccess('User updated successfully');
      setShowConfirmModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = isSuperuser()
    ? [
        { value: 'regular', label: 'Regular' },
        { value: 'cashier', label: 'Cashier' },
        { value: 'manager', label: 'Manager' },
        { value: 'superuser', label: 'Superuser' },
      ]
    : [
        { value: 'regular', label: 'Regular' },
        { value: 'cashier', label: 'Cashier' },
      ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <PageMeta title="User Not Found" description="User not found" />
        <PageBreadcrumb pageTitle="User Not Found" items={[{ label: 'Users', path: '/manager/users' }]} />
        <Alert type="error">User not found</Alert>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Edit User: ${user.name}`} description="Edit user details" />
      <PageBreadcrumb
        pageTitle="Edit User"
        items={[{ label: 'Users', path: '/manager/users' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <ComponentCard title="User Profile">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-2xl font-bold mx-auto mb-4">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {user.name}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">{user.utorid}</p>
              
              <div className="flex justify-center gap-2 mt-4">
                <Badge variant={user.verified ? 'success' : 'warning'}>
                  {user.verified ? 'Verified' : 'Unverified'}
                </Badge>
                <Badge variant={
                  user.role === 'superuser' ? 'danger' :
                  user.role === 'manager' ? 'purple' :
                  user.role === 'cashier' ? 'info' : 'default'
                }>
                  {user.role}
                </Badge>
              </div>

              {user.suspicious && (
                <Badge variant="danger" className="mt-2">
                  Suspicious
                </Badge>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-gray-800 dark:text-white">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
                <p className="text-xl font-bold text-brand-500">{user.points}</p>
              </div>
              {user.birthday && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Birthday</p>
                  <p className="text-gray-800 dark:text-white">
                    {new Date(user.birthday).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                <p className="text-gray-800 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              {user.lastLogin && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Login</p>
                  <p className="text-gray-800 dark:text-white">
                    {new Date(user.lastLogin).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <ComponentCard title="Edit User">
            {error && (
              <Alert type="error" className="mb-4" onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert type="success" className="mb-4" onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@mail.utoronto.ca"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select
                  label="Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  options={roleOptions}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Status Flags
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={verified}
                        onChange={(e) => setVerified(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Verified</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={suspicious}
                        onChange={(e) => setSuspicious(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Suspicious</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/manager/users')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Role Change"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to promote <strong>{user.name}</strong> to{' '}
          <strong className="capitalize">{pendingChanges.role}</strong>? This will give them
          additional permissions.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveChanges(pendingChanges)} disabled={saving}>
            {saving ? 'Saving...' : 'Confirm'}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default UserEditPage;

