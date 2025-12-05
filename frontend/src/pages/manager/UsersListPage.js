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

const UsersListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [name, setName] = useState(searchParams.get('name') || '');
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [verified, setVerified] = useState(searchParams.get('verified') || '');
  const [activated, setActivated] = useState(searchParams.get('activated') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit] = useState(10);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = { page, limit };
      if (name) params.name = name;
      if (role) params.role = role;
      if (verified) params.verified = verified;
      if (activated) params.activated = activated;

      const data = await api.get('/users', params);
      setUsers(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, name, role, verified, activated]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (name) params.set('name', name);
    if (role) params.set('role', role);
    if (verified) params.set('verified', verified);
    if (activated) params.set('activated', activated);
    if (page > 1) params.set('page', page);
    setSearchParams(params);
  }, [name, role, verified, activated, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleReset = () => {
    setName('');
    setRole('');
    setVerified('');
    setActivated('');
    setPage(1);
  };

  const columns = [
    {
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-white">{row.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{row.utorid}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Role',
      render: (row) => {
        const roleColors = {
          regular: 'default',
          cashier: 'info',
          manager: 'purple',
          superuser: 'danger',
        };
        return (
          <Badge variant={roleColors[row.role] || 'default'}>
            {row.role}
          </Badge>
        );
      },
    },
    {
      header: 'Points',
      render: (row) => (
        <span className="font-medium">{row.points}</span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <Badge variant={row.verified ? 'success' : 'warning'}>
            {row.verified ? 'Verified' : 'Unverified'}
          </Badge>
          {row.lastLogin && (
            <Badge variant="info">Active</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/manager/users/${row.id}`);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="All Users" description="Manage all users in the system" />
      <PageBreadcrumb pageTitle="All Users" />

      {/* Filters */}
      <ComponentCard title="Filters" className="mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Search"
              placeholder="Name or UTORid"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: '', label: 'All Roles' },
                { value: 'regular', label: 'Regular' },
                { value: 'cashier', label: 'Cashier' },
                { value: 'manager', label: 'Manager' },
                { value: 'superuser', label: 'Superuser' },
              ]}
            />
            <Select
              label="Verified"
              value={verified}
              onChange={(e) => setVerified(e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'true', label: 'Verified' },
                { value: 'false', label: 'Unverified' },
              ]}
            />
            <Select
              label="Activated"
              value={activated}
              onChange={(e) => setActivated(e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'true', label: 'Activated' },
                { value: 'false', label: 'Not Activated' },
              ]}
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

      {/* Users Table */}
      <ComponentCard title={`Users (${total})`}>
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
              data={users}
              onRowClick={(row) => navigate(`/manager/users/${row.id}`)}
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

export default UsersListPage;

