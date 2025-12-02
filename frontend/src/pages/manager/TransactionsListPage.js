import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadcrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import api from '../../utils/api';

const TransactionsListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [name, setName] = useState(searchParams.get('name') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [suspicious, setSuspicious] = useState(searchParams.get('suspicious') || '');
  const [createdBy, setCreatedBy] = useState(searchParams.get('createdBy') || '');
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [operator, setOperator] = useState(searchParams.get('operator') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit] = useState(10);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit };
      if (name) params.name = name;
      if (type) params.type = type;
      if (suspicious) params.suspicious = suspicious;
      if (createdBy) params.createdBy = createdBy;
      if (amount && operator) {
        params.amount = amount;
        params.operator = operator;
      }

      const data = await api.get('/transactions', params);
      setTransactions(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, name, type, suspicious, createdBy, amount, operator]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (name) params.set('name', name);
    if (type) params.set('type', type);
    if (suspicious) params.set('suspicious', suspicious);
    if (createdBy) params.set('createdBy', createdBy);
    if (amount) params.set('amount', amount);
    if (operator) params.set('operator', operator);
    if (page > 1) params.set('page', page);
    setSearchParams(params);
  }, [name, type, suspicious, createdBy, amount, operator, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleReset = () => {
    setName('');
    setType('');
    setSuspicious('');
    setCreatedBy('');
    setAmount('');
    setOperator('');
    setPage(1);
  };

  const getTypeBadge = (txType) => {
    const typeConfig = {
      purchase: { variant: 'success', label: 'Purchase' },
      redemption: { variant: 'orange', label: 'Redemption' },
      adjustment: { variant: 'purple', label: 'Adjustment' },
      transfer: { variant: 'info', label: 'Transfer' },
      event: { variant: 'teal', label: 'Event' },
    };
    const config = typeConfig[txType] || { variant: 'default', label: txType };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = [
    {
      header: 'ID',
      render: (row) => (
        <span className="font-mono text-sm">#{row.id}</span>
      ),
    },
    {
      header: 'User',
      accessor: 'utorid',
    },
    {
      header: 'Type',
      render: (row) => getTypeBadge(row.type),
    },
    {
      header: 'Amount',
      render: (row) => (
        <span className={`font-medium ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {row.amount >= 0 ? '+' : ''}{row.amount}
        </span>
      ),
    },
    {
      header: 'Spent',
      render: (row) => row.spent !== undefined ? `$${row.spent.toFixed(2)}` : '-',
    },
    {
      header: 'Status',
      render: (row) => (
        <div className="flex flex-col gap-1">
          {row.suspicious && (
            <Badge variant="danger">Suspicious</Badge>
          )}
          {row.type === 'redemption' && (
            <Badge variant={row.redeemed ? 'success' : 'warning'}>
              {row.redeemed ? 'Processed' : 'Pending'}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Created By',
      accessor: 'createdBy',
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/manager/transactions/${row.id}`);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="All Transactions" description="View and manage all transactions" />
      <PageBreadcrumb pageTitle="All Transactions" />

      {/* Filters */}
      <ComponentCard title="Filters" className="mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="User"
              placeholder="Name or UTORid"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'purchase', label: 'Purchase' },
                { value: 'redemption', label: 'Redemption' },
                { value: 'adjustment', label: 'Adjustment' },
                { value: 'transfer', label: 'Transfer' },
                { value: 'event', label: 'Event' },
              ]}
            />
            <Select
              label="Suspicious"
              value={suspicious}
              onChange={(e) => setSuspicious(e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'true', label: 'Suspicious' },
                { value: 'false', label: 'Not Suspicious' },
              ]}
            />
            <Input
              label="Created By"
              placeholder="UTORid"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Amount Filter"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                options={[
                  { value: '', label: 'None' },
                  { value: 'gte', label: '>=' },
                  { value: 'lte', label: '<=' },
                ]}
              />
              <Input
                label="Value"
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!operator}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit">Search</Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>
      </ComponentCard>

      {/* Transactions Table */}
      <ComponentCard title={`Transactions (${total})`}>
        {error && (
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <Loading className="py-12" />
        ) : (
          <>
            <Table
              columns={columns}
              data={transactions}
              onRowClick={(row) => navigate(`/manager/transactions/${row.id}`)}
            />
            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </ComponentCard>
    </>
  );
};

export default TransactionsListPage;

