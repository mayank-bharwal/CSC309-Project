import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadcrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const TransactionDetailPage = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  // Adjustment modal
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentRemark, setAdjustmentRemark] = useState('');

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const data = await api.get(`/transactions/${transactionId}`);
        setTransaction(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  const handleMarkSuspicious = async (suspicious) => {
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const data = await api.patch(`/transactions/${transactionId}/suspicious`, {
        suspicious,
      });
      setTransaction(data);
      setSuccess(`Transaction marked as ${suspicious ? 'suspicious' : 'not suspicious'}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      await api.post('/transactions', {
        utorid: transaction.utorid,
        type: 'adjustment',
        amount: parseInt(adjustmentAmount),
        relatedId: transaction.id,
        remark: adjustmentRemark || undefined,
      });
      setSuccess('Adjustment transaction created successfully');
      setShowAdjustmentModal(false);
      setAdjustmentAmount('');
      setAdjustmentRemark('');
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      purchase: { variant: 'success', label: 'Purchase' },
      redemption: { variant: 'orange', label: 'Redemption' },
      adjustment: { variant: 'purple', label: 'Adjustment' },
      transfer: { variant: 'info', label: 'Transfer' },
      event: { variant: 'teal', label: 'Event' },
    };
    const config = typeConfig[type] || { variant: 'default', label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <>
        <PageMeta title="Transaction Not Found" description="Transaction not found" />
        <PageBreadcrumb pageTitle="Transaction Not Found" items={[{ label: 'Transactions', path: '/manager/transactions' }]} />
        <Alert type="error">Transaction not found</Alert>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Transaction #${transactionId}`} description="View transaction details" />
      <PageBreadcrumb
        pageTitle={`Transaction #${transactionId}`}
        items={[{ label: 'Transactions', path: '/manager/transactions' }]}
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
        {/* Transaction Info */}
        <div className="lg:col-span-2">
          <ComponentCard title="Transaction Details">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</p>
                <p className="text-lg font-mono font-bold text-gray-800 dark:text-white">
                  #{transaction.id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                <div className="mt-1">{getTypeBadge(transaction.type)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                <p className="text-gray-800 dark:text-white font-medium">
                  {transaction.utorid}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created By</p>
                <p className="text-gray-800 dark:text-white font-medium">
                  {transaction.createdBy}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                <p className={`text-2xl font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount >= 0 ? '+' : ''}{transaction.amount} pts
                </p>
              </div>
              {transaction.spent !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount Spent</p>
                  <p className="text-gray-800 dark:text-white font-medium">
                    ${transaction.spent.toFixed(2)}
                  </p>
                </div>
              )}
              {transaction.redeemed !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Redeemed</p>
                  <p className="text-gray-800 dark:text-white font-medium">
                    {transaction.redeemed} pts
                  </p>
                </div>
              )}
              {transaction.relatedId !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Related ID</p>
                  <p className="text-gray-800 dark:text-white font-medium">
                    #{transaction.relatedId}
                  </p>
                </div>
              )}
              {transaction.promotionIds?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Promotions Applied</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {transaction.promotionIds.map((id) => (
                      <Badge key={id} variant="info">Promotion #{id}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {transaction.remark && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Remark</p>
                  <p className="text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-1">
                    {transaction.remark}
                  </p>
                </div>
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Card */}
          <ComponentCard title="Status">
            <div className="space-y-4">
              {(transaction.type === 'purchase' || transaction.type === 'adjustment') && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Suspicious Flag</p>
                  <Badge variant={transaction.suspicious ? 'danger' : 'success'}>
                    {transaction.suspicious ? 'Suspicious' : 'Normal'}
                  </Badge>
                </div>
              )}
              
              {transaction.type === 'redemption' && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Processing Status</p>
                  <Badge variant={transaction.redeemed ? 'success' : 'warning'}>
                    {transaction.redeemed ? 'Processed' : 'Pending'}
                  </Badge>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Actions Card */}
          <ComponentCard title="Actions">
            <div className="space-y-3">
              {(transaction.type === 'purchase' || transaction.type === 'adjustment') && (
                <>
                  {transaction.suspicious ? (
                    <Button
                      variant="success"
                      className="w-full"
                      onClick={() => handleMarkSuspicious(false)}
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Mark as Not Suspicious'}
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      className="w-full"
                      onClick={() => handleMarkSuspicious(true)}
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Mark as Suspicious'}
                    </Button>
                  )}
                </>
              )}

              {(transaction.type === 'purchase' || transaction.type === 'adjustment') && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAdjustmentModal(true)}
                >
                  Create Adjustment
                </Button>
              )}

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/manager/transactions')}
              >
                Back to List
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>

      {/* Adjustment Modal */}
      <Modal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        title="Create Adjustment Transaction"
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Create an adjustment for transaction #{transaction.id} ({transaction.utorid})
            </p>
            <Input
              label="Amount (can be negative)"
              type="number"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              placeholder="e.g., -50 or 100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Remark (optional)
            </label>
            <textarea
              value={adjustmentRemark}
              onChange={(e) => setAdjustmentRemark(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              rows={3}
              placeholder="Reason for adjustment..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAdjustmentModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Creating...' : 'Create Adjustment'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default TransactionDetailPage;

