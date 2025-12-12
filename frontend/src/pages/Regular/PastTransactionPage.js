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

const PastTransactionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // API DATA
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);

  // STATE
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FILTERS
  const [type, setType] = useState(searchParams.get("type") || "");
  const [amount, setAmount] = useState(searchParams.get("amount") || "");
  const [operator, setOperator] = useState(searchParams.get("operator") || "");
  const [order, setOrder] = useState(searchParams.get("order") || "desc");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const limit = 10;

  // FETCH TRANSACTIONS
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit };
      if (type) params.type = type;
      if (amount && operator) {
        params.amount = amount;
        params.operator = operator;
      }

      const data = await api.get("/users/me/transactions", params);

      const results =
        order === "asc"
          ? [...data.results].reverse()
          : data.results;

      setTransactions(results);
      setTotal(data.count);
    } catch (err) {
      setError(err.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [type, amount, operator, order, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // UPDATE URL PARAMS
  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (amount) params.set("amount", amount);
    if (operator) params.set("operator", operator);
    if (order !== "desc") params.set("order", order);
    if (page > 1) params.set("page", page);
    setSearchParams(params);
  }, [type, amount, operator, order, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleReset = () => {
    setType("");
    setAmount("");
    setOperator("");
    setOrder("desc");
    setPage(1);
  };

  // TYPE BADGES
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
        <span
          className={
            row.amount < 0
              ? "text-red-600 dark:text-red-400 font-medium"
              : "text-green-600 dark:text-green-400 font-medium"
          }
        >
          {row.amount > 0 ? `+${row.amount}` : row.amount}
        </span>
      ),
    },
    {
      header: "Related User",
      render: (row) =>
        row.relatedId ? (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            User ID {row.relatedId}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      header: "Created By",
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.createdBy}
        </span>
      ),
    },
    {
      header: "Promotions",
      render: (row) =>
        row.promotionIds.length ? (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {row.promotionIds.join(", ")}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      header: "Reference",
      render: (row) => (
        <span className="text-sm text-gray-500">
          Transaction #{row.id}
        </span>
      ),
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
                { value: "redemption", label: "Redemption" },
                { value: "adjustment", label: "Adjustment" },
                { value: "event", label: "Event" },
              ]}
            />

            <Input
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50"
            />

            <Select
              label="Operator"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              options={[
                { value: "", label: "None" },
                { value: "gte", label: "≥" },
                { value: "lte", label: "≤" },
              ]}
            />

            <Select
              label="Order"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              options={[
                { value: "desc", label: "Newest first" },
                { value: "asc", label: "Oldest first" },
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

export default PastTransactionPage;