import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import api from "../../utils/api";

const TransferPoints = () => {
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await api.post(`/users/${recipientId}/transactions`, {
        type: "transfer",
        amount: Number(amount),
        remark: remark || undefined,
      });

      setStatus("success");

      setRecipientId("");
      setAmount("");
      setRemark("");

      setTimeout(() => {
        setStatus(null);
      }, 3000);
    } catch (err) {
      const msg =
        err.message || "Transaction failed. Please try again.";
      setStatus(`error:${msg}`);
    }
  };

  return (
    <>
      <PageMeta title="Transfer Points" />
      <PageBreadcrumb pageTitle="Transfer Points" />

      <ComponentCard
        title="Transfer Points"
        desc="Enter a recipient and amount to send points."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Recipient User ID
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Enter the numeric user ID of the recipient.
            </p>
            <input
              type="text"
              pattern="^[0-9]+$"
              className="w-full rounded-lg px-4 py-2 
                bg-white dark:bg-gray-900 
                border border-gray-300 dark:border-gray-700 
                text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Amount
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Number of points to transfer.
            </p>
            <input
              type="number"
              min="1"
              className="w-full rounded-lg px-4 py-2 
                bg-white dark:bg-gray-900 
                border border-gray-300 dark:border-gray-700 
                text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Remark */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Remark (Optional)
            </label>
            <input
              type="text"
              className="w-full rounded-lg px-4 py-2 
                bg-white dark:bg-gray-900 
                border border-gray-300 dark:border-gray-700 
                text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold 
              hover:bg-blue-700 transition
              disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Processing..." : "Send Points"}
          </button>

          {/* Status messages */}
          {status === "loading" && (
            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              Processing transaction...
            </p>
          )}
          {status === "success" && (
            <p className="text-green-600 dark:text-green-400 text-sm font-semibold">
              Transfer successful!
            </p>
          )}
          {status?.startsWith("error:") && (
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">
              {status.replace("error:", "")}
            </p>
          )}
        </form>
      </ComponentCard>
    </>
  );
};

export default TransferPoints;