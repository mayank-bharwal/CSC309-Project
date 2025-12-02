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

const EventsListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [name, setName] = useState(searchParams.get('name') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [published, setPublished] = useState(searchParams.get('published') || '');
  const [started, setStarted] = useState(searchParams.get('started') || '');
  const [ended, setEnded] = useState(searchParams.get('ended') || '');
  const [showFull, setShowFull] = useState(searchParams.get('showFull') || 'true');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit] = useState(10);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit, showFull };
      if (name) params.name = name;
      if (location) params.location = location;
      if (published) params.published = published;
      if (started) params.started = started;
      if (ended) params.ended = ended;

      const data = await api.get('/events', params);
      setEvents(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, name, location, published, started, ended, showFull]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (name) params.set('name', name);
    if (location) params.set('location', location);
    if (published) params.set('published', published);
    if (started) params.set('started', started);
    if (ended) params.set('ended', ended);
    if (showFull !== 'true') params.set('showFull', showFull);
    if (page > 1) params.set('page', page);
    setSearchParams(params);
  }, [name, location, published, started, ended, showFull, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleReset = () => {
    setName('');
    setLocation('');
    setPublished('');
    setStarted('');
    setEnded('');
    setShowFull('true');
    setPage(1);
  };

  const getStatusBadge = (event) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (end < now) return <Badge variant="default">Ended</Badge>;
    if (start > now) return <Badge variant="info">Upcoming</Badge>;
    return <Badge variant="success">In Progress</Badge>;
  };

  const columns = [
    {
      header: 'Event',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white">{row.name}</p>
          <p className="text-sm text-gray-500">{row.location}</p>
        </div>
      ),
    },
    {
      header: 'Date/Time',
      render: (row) => (
        <div className="text-sm">
          <p>{new Date(row.startTime).toLocaleDateString()}</p>
          <p className="text-gray-500">
            {new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      header: 'Capacity',
      render: (row) => (
        <span>
          {row.numGuests}/{row.capacity || '∞'}
        </span>
      ),
    },
    {
      header: 'Points',
      render: (row) => (
        <div className="text-sm">
          <p>Remain: {row.pointsRemain}</p>
          <p className="text-gray-500">Awarded: {row.pointsAwarded}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(row)}
          <Badge variant={row.published ? 'success' : 'warning'}>
            {row.published ? 'Published' : 'Draft'}
          </Badge>
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
            navigate(`/manager/events/${row.id}`);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="All Events" description="Manage all events" />
      <PageBreadcrumb pageTitle="All Events" />

      {/* Filters */}
      <ComponentCard title="Filters" className="mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Name"
              placeholder="Search by name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Location"
              placeholder="Search by location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Select
              label="Published"
              value={published}
              onChange={(e) => setPublished(e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'true', label: 'Published' },
                { value: 'false', label: 'Draft' },
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
            <Select
              label="Show Full Events"
              value={showFull}
              onChange={(e) => setShowFull(e.target.value)}
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
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

      {/* Create Button */}
      <div className="mb-6 flex justify-end">
        <Link to="/manager/events/create">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </Button>
        </Link>
      </div>

      {/* Events Table */}
      <ComponentCard title={`Events (${total})`}>
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
              data={events}
              onRowClick={(row) => navigate(`/manager/events/${row.id}`)}
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

export default EventsListPage;

