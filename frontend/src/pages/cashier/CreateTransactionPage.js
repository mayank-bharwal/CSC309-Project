import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import api from "../../utils/api";

const CreateTransactionPage = () => {
  const [userId, setUserId] = useState("");
  const [transactionType, setTransactionType] = useState("purchase");
  const [amount, setAmount] = useState("");
  const [spent, setSpent] = useState("");
  const [redeemed, setRedeemed] = useState("");
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const payload = {
        type: transactionType,
        amount: Number(amount),
        remark: remark || undefined,
      };

      // Add type-specific fields
      if (transactionType === "purchase" && spent) {
        payload.spent = Number(spent);
      }
      if (transactionType === "redemption" && redeemed) {
        payload.redeemed = Number(redeemed);
      }

      await api.post(`/transactions`, {
        ...payload,
        userId: Number(userId),
      });

      setStatus("success");
      setTimeout(() => {
        setStatus(null);
      }, 3000);

      // Reset form
      setUserId("");
      setAmount("");
      setSpent("");
      setRedeemed("");
      setRemark("");
    } catch (err) {
      const msg = err.message || "Transaction creation failed. Please try again.";
      setStatus(`error:${msg}`);
    }
  };

  return (
    <>
      <PageMeta title="Create Transaction" />
      <PageBreadcrumb pageTitle="Create Transaction" />

      <ComponentCard
        title="Create New Transaction"
        desc="Create a transaction for a user by entering their details below."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User ID */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              User ID
            </label>
            <input
              type="text"
              pattern="^[0-9]+$"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the numeric user ID
            </p>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Transaction Type
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              required
            >
              <option value="purchase">Purchase</option>
              <option value="redemption">Redemption</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Points Amount
            </label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter points amount"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {transactionType === "redemption"
                ? "Use negative value for redemptions (e.g., -100)"
                : "Positive value for points earned"}
            </p>
          </div>

          {/* Spent (for purchases) */}
          {transactionType === "purchase" && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Amount Spent ($)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={spent}
                onChange={(e) => setSpent(e.target.value)}
                placeholder="Enter dollar amount spent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The dollar amount the user spent (optional)
              </p>
            </div>
          )}

          {/* Redeemed (for redemptions) */}
          {transactionType === "redemption" && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Points Redeemed
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={redeemed}
                onChange={(e) => setRedeemed(e.target.value)}
                placeholder="Enter points redeemed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Number of points being redeemed (optional)
              </p>
            </div>
          )}

          {/* Remark */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Remark (Optional)
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add a note about this transaction"
              rows="3"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Creating Transaction..." : "Create Transaction"}
          </button>

          {/* Status messages */}
          {status === "loading" && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">Processing transaction...</p>
            </div>
          )}

          {status === "success" && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                Transaction created successfully!
              </p>
            </div>
          )}

          {status?.startsWith("error:") && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {status.replace("error:", "")}
              </p>
            </div>
          )}
        </form>
      </ComponentCard>
    </>
  );
};

export default CreateTransactionPage;
