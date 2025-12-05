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
import api from '../../utils/api';

const PromotionEditPage = () => {
  const { promotionId } = useParams();
  const navigate = useNavigate();

  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('automatic');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [minSpending, setMinSpending] = useState('');
  const [rate, setRate] = useState('');
  const [points, setPoints] = useState('');

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        const data = await api.get(`/promotions/${promotionId}`);
        setPromotion(data);
        setName(data.name || '');
        setDescription(data.description || '');
        setType(data.type || 'automatic');
        setStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : '');
        setEndTime(data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : '');
        setMinSpending(data.minSpending?.toString() || '');
        setRate(data.rate?.toString() || '');
        setPoints(data.points?.toString() || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();
  }, [promotionId]);

  const hasStarted = promotion && new Date(promotion.startTime) <= new Date();
  const hasEnded = promotion && new Date(promotion.endTime) <= new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = {};
      
      if (name !== promotion.name) data.name = name;
      if (description !== promotion.description) data.description = description;
      if (type !== promotion.type) data.type = type;
      if (startTime && new Date(startTime).toISOString() !== new Date(promotion.startTime).toISOString()) {
        data.startTime = new Date(startTime).toISOString();
      }
      if (endTime && new Date(endTime).toISOString() !== new Date(promotion.endTime).toISOString()) {
        data.endTime = new Date(endTime).toISOString();
      }
      
      const newMinSpending = minSpending ? parseFloat(minSpending) : null;
      if (newMinSpending !== promotion.minSpending) data.minSpending = newMinSpending;
      
      const newRate = rate ? parseFloat(rate) : null;
      if (newRate !== promotion.rate) data.rate = newRate;
      
      const newPoints = points ? parseInt(points) : null;
      if (newPoints !== promotion.points) data.points = newPoints;

      if (Object.keys(data).length === 0) {
        setError('No changes to save');
        setSaving(false);
        return;
      }

      const result = await api.patch(`/promotions/${promotionId}`, data);
      setPromotion((prev) => ({ ...prev, ...result }));
      setSuccess('Promotion updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      await api.delete(`/promotions/${promotionId}`);
      navigate('/manager/promotions');
    } catch (err) {
      setError(err.message);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = () => {
    const now = new Date();
    const start = new Date(promotion.startTime);
    const end = new Date(promotion.endTime);

    if (end < now) return <Badge variant="default">Ended</Badge>;
    if (start > now) return <Badge variant="info">Upcoming</Badge>;
    return <Badge variant="success">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (!promotion) {
    return (
      <>
        <PageMeta title="Promotion Not Found" description="Promotion not found" />
        <PageBreadcrumb pageTitle="Promotion Not Found" items={[{ label: 'Promotions', path: '/manager/promotions' }]} />
        <Alert type="error">Promotion not found</Alert>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Edit: ${promotion.name}`} description="Edit promotion details" />
      <PageBreadcrumb
        pageTitle="Edit Promotion"
        items={[{ label: 'Promotions', path: '/manager/promotions' }]}
      />

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" className="mb-6" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-1">
          <ComponentCard title="Promotion Info">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
                <p className="font-mono text-gray-800 dark:text-white">#{promotion.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                <Badge variant={promotion.type === 'automatic' ? 'purple' : 'orange'}>
                  {promotion.type}
                </Badge>
              </div>

              {hasStarted && (
                <Alert type="warning">
                  This promotion has started. Some fields cannot be edited.
                </Alert>
              )}

              {!hasStarted && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Promotion
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Only promotions that haven't started can be deleted
                  </p>
                </div>
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <ComponentCard title="Edit Details">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Promotion name"
                disabled={hasStarted}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={3}
                  disabled={hasStarted}
                  required
                />
              </div>

              <Select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={[
                  { value: 'automatic', label: 'Automatic' },
                  { value: 'one-time', label: 'One-time' },
                ]}
                disabled={hasStarted}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={hasStarted}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={hasEnded}
                    required
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Bonus Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Input
                    label="Min Spending ($)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={minSpending}
                    onChange={(e) => setMinSpending(e.target.value)}
                    placeholder="50.00"
                    disabled={hasStarted}
                  />
                  <Input
                    label="Rate Multiplier"
                    type="number"
                    step="0.1"
                    min="0"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="2.0"
                    disabled={hasStarted}
                  />
                  <Input
                    label="Bonus Points"
                    type="number"
                    min="0"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="100"
                    disabled={hasStarted}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/manager/promotions')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Promotion"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete the promotion "{promotion.name}"? This action cannot be
          undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default PromotionEditPage;

