import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const ListPromotionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // API data
  const [promotions, setPromotions] = useState([]);
  const [total, setTotal] = useState(0);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters (loaded from URL)
  const [name, setName] = useState(searchParams.get("name") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit] = useState(10);

  // Fetch promotions for Regular user
  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit };
      if (name) params.name = name;
      if (type) params.type = type;

      // Regular user sees ACTIVE promotions only
      const data = await api.get("/promotions", params);

      setPromotions(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(err.message || "Failed to load promotions.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, name, type]);

  // Fetch on load + filter changes
  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // Sync URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (type) params.set("type", type);
    if (page > 1) params.set("page", page);
    setSearchParams(params);
  }, [name, type, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPromotions();
  };

  const handleReset = () => {
    setName("");
    setType("");
    setPage(1);
  };

  // Active promotions badge logic
  const getStatusBadge = (promo) => {
    const now = new Date();
    const end = new Date(promo.endTime);
    if (end < now) return <Badge variant="default">Ended</Badge>;
    return <Badge variant="success">Active</Badge>;
  };

  // Table columns for Regular User
  const columns = [
    {
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white">{row.name}</p>
          <p className="text-xs text-gray-500">ID: {row.id}</p>
        </div>
      ),
    },
    {
      header: "Type",
      render: (row) => (
        <Badge variant={row.type === "automatic" ? "purple" : "orange"}>
          {row.type}
        </Badge>
      ),
    },
    {
      header: "Ends On",
      render: (row) => (
        <p>{new Date(row.endTime).toLocaleDateString()}</p>
      ),
    },
    {
      header: "Details",
      render: (row) => (
        <div className="text-sm">
          {row.minSpending && <p>Min Spend: ${row.minSpending}</p>}
          {row.rate && <p>Rate: +{row.rate}x pts</p>}
          {row.points && <p>Points: {row.points}</p>}
        </div>
      ),
    },
    {
      header: "Status",
      render: (row) => getStatusBadge(row),
    },
  ];

  return (
    <>
      <PageMeta title="Available Promotions" />

      {/* Filters */}
      <ComponentCard title="Filters" className="mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Search by name"
            />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: "", label: "All Types" },
                { value: "automatic", label: "Automatic" },
                { value: "one-time", label: "One-time" },
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

      {/* Promotions Table */}
      <ComponentCard title={`Promotions (${total})`}>
        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <Loading className="py-12" />
        ) : (
          <>
            <Table
              columns={columns}
              data={promotions}
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

export default ListPromotionsPage;