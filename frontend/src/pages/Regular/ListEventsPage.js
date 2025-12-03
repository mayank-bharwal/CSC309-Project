import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Table from "../../components/common/Table";
import Pagination from "../../components/common/Pagination";
import Badge from "../../components/common/Badge";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Loading from "../../components/common/Loading";
import Alert from "../../components/common/Alert";
import api from "../../utils/api";

const ListEventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // API data
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters (from URL)
  const [name, setName] = useState(searchParams.get("name") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [started, setStarted] = useState(searchParams.get("started") || "");
  const [ended, setEnded] = useState(searchParams.get("ended") || "");
  const [showFull, setShowFull] = useState(searchParams.get("showFull") || "");

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit] = useState(10);

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit };

      if (name) params.name = name;
      if (location) params.location = location;
      if (started) params.started = started === "true";
      if (ended) params.ended = ended === "true";
      if (showFull) params.showFull = showFull === "true";

      const data = await api.get("/events", params);

      setEvents(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(err.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [name, location, started, ended, showFull, page, limit]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Sync URL search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (location) params.set("location", location);
    if (started) params.set("started", started);
    if (ended) params.set("ended", ended);
    if (showFull) params.set("showFull", showFull);
    if (page > 1) params.set("page", page);
    setSearchParams(params);
  }, [name, location, started, ended, showFull, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleReset = () => {
    setName("");
    setLocation("");
    setStarted("");
    setEnded("");
    setShowFull("");
    setPage(1);
  };

  // Badge for event status
  const getStatusBadge = (event) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (now < start) return <Badge variant="purple">Upcoming</Badge>;
    if (now > end) return <Badge variant="default">Ended</Badge>;
    return <Badge variant="success">Ongoing</Badge>;
  };

  const columns = [
    {
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-gray-500">ID: {row.id}</p>
        </div>
      ),
    },
    {
      header: "Location",
      render: (row) => <p>{row.location}</p>,
    },
    {
      header: "Starts",
      render: (row) => new Date(row.startTime).toLocaleString(),
    },
    {
      header: "Ends",
      render: (row) => new Date(row.endTime).toLocaleString(),
    },
    {
      header: "Capacity",
      render: (row) => (
        <p>
          {row.numGuests}/{row.capacity}
        </p>
      ),
    },
    {
      header: "Status",
      render: (row) => getStatusBadge(row),
    },
  ];

  return (
    <>
      <PageMeta title="Events" />

      {/* Filters */}
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
            <Select
              label="Started"
              value={started}
              onChange={(e) => setStarted(e.target.value)}
              options={[
                { value: "", label: "Any" },
                { value: "true", label: "Already started" },
                { value: "false", label: "Not started yet" },
              ]}
            />
            <Select
              label="Ended"
              value={ended}
              onChange={(e) => setEnded(e.target.value)}
              options={[
                { value: "", label: "Any" },
                { value: "true", label: "Already ended" },
                { value: "false", label: "Not ended" },
              ]}
            />
            <Select
              label="Show Full Events"
              value={showFull}
              onChange={(e) => setShowFull(e.target.value)}
              options={[
                { value: "", label: "Hide full events" },
                { value: "true", label: "Show full events" },
              ]}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>
      </ComponentCard>

      {/* Table */}
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