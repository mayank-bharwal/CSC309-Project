import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
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

  const [promotions, setPromotions] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState(searchParams.get("name") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const limit = 10;

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      setError("");

      try {
        const params = { page, limit };
        if (name) params.name = name;
        if (type) params.type = type;

        const data = await api.get("/promotions", params);
        setPromotions(data.results);
        setTotal(data.count);
      } catch (err) {
        setError(err.message || "Failed to load promotions.");
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, [page, name, type]);

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
  };

  const handleReset = () => {
    setName("");
    setType("");
    setPage(1);
  };

  const columns = [
    {
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {row.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ID: {row.id}
          </p>
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
      render: (row) =>
        new Date(row.endTime).toLocaleDateString(),
    },
    {
      header: "Details",
      render: (row) => (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {row.minSpending && <p>Min spend: ${row.minSpending}</p>}
          {row.rate && <p>Rate: {row.rate}x points</p>}
          {row.points && <p>Bonus points: {row.points}</p>}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Available Promotions" />
      <PageBreadcrumb pageTitle="Available Promotions" />

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
                { value: "", label: "All types" },
                { value: "automatic", label: "Automatic" },
                { value: "one-time", label: "One-time" },
              ]}
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

      <ComponentCard title={`Promotions (${total})`}>
        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <Loading className="py-12" />
        ) : (
          <>
            <Table columns={columns} data={promotions} />
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