import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Table from "../../components/common/Table";
import Pagination from "../../components/common/Pagination";
import Badge from "../../components/common/Badge";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import Alert from "../../components/common/Alert";
import api from "../../utils/api";

const ListEventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState(searchParams.get("name") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const limit = 10;

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError("");

      try {
        const params = { page, limit };
        if (name) params.name = name;
        if (location) params.location = location;

        const data = await api.get("/events", params);
        setEvents(data.results);
        setTotal(data.count);
      } catch (err) {
        setError(err.message || "Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [page, name, location]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (location) params.set("location", location);
    if (page > 1) params.set("page", page);
    setSearchParams(params);
  }, [name, location, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleReset = () => {
    setName("");
    setLocation("");
    setPage(1);
  };

  const columns = [
    {
      header: "Name",
      render: (row) => (
        <div>
          <button
            onClick={() => navigate(`/regular/events/${row.id}`)}
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
          >
            {row.name}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ID: {row.id}
          </p>
        </div>
      ),
    },
    {
      header: "Location",
      render: (row) => (
        <p className="text-gray-700 dark:text-gray-300">
          {row.location}
        </p>
      ),
    },
    {
      header: "Starts",
      render: (row) =>
        new Date(row.startTime).toLocaleString(),
    },
    {
      header: "Ends",
      render: (row) =>
        new Date(row.endTime).toLocaleString(),
    },
    {
      header: "Capacity",
      render: (row) => (
        <p className="text-gray-700 dark:text-gray-300">
          {row.numGuests}/{row.capacity}
        </p>
      ),
    },
    {
      header: "Status",
      render: (row) => {
        const now = new Date();
        const start = new Date(row.startTime);
        const end = new Date(row.endTime);

        if (now < start) {
          return <Badge variant="purple">Upcoming</Badge>;
        }
        if (now > end) {
          return <Badge variant="default">Ended</Badge>;
        }
        return <Badge variant="success">Ongoing</Badge>;
      },
    },
  ];

  return (
    <>
      <PageMeta title="Events" />
      <PageBreadcrumb pageTitle="Events" />

      <ComponentCard title="Filters" className="mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Search by event name"
            />
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Search by location"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </form>
      </ComponentCard>

      <ComponentCard title={`Events (${total})`}>
        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <Loading className="py-12" />
        ) : (
          <>
            <Table columns={columns} data={events} />
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

export default ListEventsPage;