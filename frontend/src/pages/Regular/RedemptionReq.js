import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import api from "../../utils/api";

const RedemptionReq = () => {
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await api.post("/users/me/transactions", {
        type: "redemption",
        amount: Number(amount),
        remark: remark || undefined,
      });

      setStatus("success");
      setAmount("");
      setRemark("");

      setTimeout(() => {
        setStatus(null);
      }, 3000);
    } catch (err) {
      const msg =
        err.message ||
        "Redemption request failed. Please check your balance or verification status.";
      setStatus(`error:${msg}`);
    }
  };

  return (
    <>
      <PageMeta title="Redeem Points" />
      <PageBreadcrumb pageTitle="Redeem Points" />

      <ComponentCard
        title="Redeem Points"
        desc="Submit a redemption request to be processed by a cashier."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Amount to Redeem
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Enter the number of points you want to redeem.
            </p>
            <input
              type="number"
              min="1"
              required
              className="w-full rounded-lg px-4 py-2
                bg-white dark:bg-gray-900
                border border-gray-300 dark:border-gray-700
                text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
            disabled={status === "loading"}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold
              hover:bg-blue-700 transition
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading"
              ? "Submitting..."
              : "Submit Redemption Request"}
          </button>

          {/* Status messages */}
          {status === "success" && (
            <p className="text-green-600 dark:text-green-400 text-sm font-semibold">
              Redemption request submitted successfully.
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

export default RedemptionReq;