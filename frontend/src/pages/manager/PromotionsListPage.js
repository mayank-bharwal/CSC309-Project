import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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

const PromotionsListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [promotions, setPromotions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [name, setName] = useState(searchParams.get('name') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [started, setStarted] = useState(searchParams.get('started') || '');
  const [ended, setEnded] = useState(searchParams.get('ended') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit] = useState(10);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit };
      if (name) params.name = name;
      if (type) params.type = type;
      if (started) params.started = started;
      if (ended) params.ended = ended;

      const data = await api.get('/promotions', params);
      setPromotions(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, name, type, started, ended]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (name) params.set('name', name);
    if (type) params.set('type', type);
    if (started) params.set('started', started);
    if (ended) params.set('ended', ended);
    if (page > 1) params.set('page', page);
    setSearchParams(params);
  }, [name, type, started, ended, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPromotions();
  };

  const handleReset = () => {
    setName('');
    setType('');
    setStarted('');
    setEnded('');
    setPage(1);
  };

  const getStatusBadge = (promo) => {
    const now = new Date();
    const start = new Date(promo.startTime);
    const end = new Date(promo.endTime);

    if (end < now) return <Badge variant="default">Ended</Badge>;
    if (start > now) return <Badge variant="info">Upcoming</Badge>;
    return <Badge variant="success">Active</Badge>;
  };

  const columns = [
    {
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white">{row.name}</p>
          <p className="text-xs text-gray-500">ID: {row.id}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      render: (row) => (
        <Badge variant={row.type === 'automatic' ? 'purple' : 'orange'}>
          {row.type}
        </Badge>
      ),
    },
    {
      header: 'Timing',
      render: (row) => (
        <div className="text-sm">
          {row.startTime && (
            <p>
              <span className="text-gray-500">Start:</span>{' '}
              {new Date(row.startTime).toLocaleDateString()}
            </p>
          )}
          <p>
            <span className="text-gray-500">End:</span>{' '}
            {new Date(row.endTime).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      header: 'Details',
      render: (row) => (
        <div className="text-sm">
          {row.minSpending && <p>Min: ${row.minSpending}</p>}
          {row.rate && <p>Rate: {row.rate}x</p>}
          {row.points && <p>Points: {row.points}</p>}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => getStatusBadge(row),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/manager/promotions/${row.id}`);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="All Promotions" description="Manage all promotions" />
      <PageBreadcrumb
        pageTitle="All Promotions"
        actions={
          <Link to="/manager/promotions/create">
            <Button>Create Promotion</Button>
          </Link>
        }
      />

      {/* Filters */}
      <ComponentCard title="Filters" className="mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Name"
              placeholder="Search by name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'automatic', label: 'Automatic' },
                { value: 'one-time', label: 'One-time' },
              ]}
            />
            <Select
              label="Started"
              value={started}
              onChange={(e) => {
                setStarted(e.target.value);
                if (e.target.value) setEnded('');
              }}
              options={[
                { value: '', label: 'Any' },
                { value: 'true', label: 'Started' },
                { value: 'false', label: 'Not Started' },
              ]}
              disabled={ended !== ''}
            />
            <Select
              label="Ended"
              value={ended}
              onChange={(e) => {
                setEnded(e.target.value);
                if (e.target.value) setStarted('');
              }}
              options={[
                { value: '', label: 'Any' },
                { value: 'true', label: 'Ended' },
                { value: 'false', label: 'Not Ended' },
              ]}
              disabled={started !== ''}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit">Search</Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>
      </ComponentCard>

      {/* Create Button */}
      <div className="mb-6 flex justify-end">
        <Link to="/manager/promotions/create">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Promotion
          </Button>
        </Link>
      </div>

      {/* Promotions Table */}
      <ComponentCard title={`Promotions (${total})`}>
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
              data={promotions}
              onRowClick={(row) => navigate(`/manager/promotions/${row.id}`)}
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

export default PromotionsListPage;

