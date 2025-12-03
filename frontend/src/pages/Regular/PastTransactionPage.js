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

const ListTransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // API DATA
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);

  // STATE
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FILTERS — from URL params
  const [type, setType] = useState(searchParams.get("type") || "");
  const [amount, setAmount] = useState(searchParams.get("amount") || "");
  const [operator, setOperator] = useState(searchParams.get("operator") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit] = useState(10);

  // FETCH TRANSACTIONS
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit };
      if (type) params.type = type;
      if (amount) params.amount = amount;
      if (operator) params.operator = operator;

      const data = await api.get("/users/me/transactions", params);

      setTransactions(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(err.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [type, amount, operator, page, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // UPDATE URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (amount) params.set("amount", amount);
    if (operator) params.set("operator", operator);
    if (page > 1) params.set("page", page);
    setSearchParams(params);
  }, [type, amount, operator, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleReset = () => {
    setType("");
    setAmount("");
    setOperator("");
    setPage(1);
  };

  // BADGE COLOR STYLES PER TRANSACTION TYPE
  const getTypeBadge = (t) => {
    const map = {
      purchase: "green",
      transfer: "blue",
      redemption: "orange",
      adjustment: "red",
      event: "purple",
    };
    return <Badge variant={map[t] || "default"}>{t}</Badge>;
  };

  // TABLE COLUMNS
  const columns = [
    {
      header: "Type",
      render: (row) => getTypeBadge(row.type),
    },
    {
      header: "Amount",
      render: (row) => (
        <p className={row.amount < 0 ? "text-red-600" : "text-green-600"}>
          {row.amount}
        </p>
      ),
    },
    {
      header: "Related User",
      render: (row) =>
        row.relatedId ? (
          <p className="text-sm text-gray-700">
            User ID: <strong>{row.relatedId}</strong>
          </p>
        ) : (
          "-"
        ),
    },
    {
      header: "Created By",
      render: (row) => <p className="text-sm">{row.createdBy}</p>,
    },
    {
      header: "Promotion IDs",
      render: (row) => (
        <p className="text-xs text-gray-600">
          {row.promotionIds?.length ? row.promotionIds.join(", ") : "-"}
        </p>
      ),
    },
    {
      header: "Date",
      render: (row) =>
        new Date(row.createdAt).toLocaleString("en-CA", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
  ];

  return (
    <>
      <PageMeta title="My Transactions" />

      <ComponentCard title="Filters" className="mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: "", label: "All" },
                { value: "purchase", label: "Purchase" },
                { value: "transfer", label: "Transfer" },
                { value: "adjustment", label: "Adjustment" },
                { value: "redemption", label: "Redemption" },
                { value: "event", label: "Event" },
              ]}
            />

            <Input
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 50"
            />

            <Select
              label="Operator"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              options={[
                { value: "", label: "None" },
                { value: "gte", label: ">= (greater than or equal)" },
                { value: "lte", label: "<= (less than or equal)" },
              ]}
            />
          </div>

          <div className="flex gap-3">
            <button className="btn btn-primary">Search</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>
      </ComponentCard>

      <ComponentCard title={`Transactions (${total})`}>
        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <Loading className="py-12" />
        ) : (
          <>
            <Table columns={columns} data={transactions} />
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

export default ListTransactionsPage;