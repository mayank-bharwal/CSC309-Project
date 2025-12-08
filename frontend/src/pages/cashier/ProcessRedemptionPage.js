import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import api from "../../utils/api";

const ProcessRedemptionPage = () => {
  const [transactionId, setTransactionId] = useState("");
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setTransactionDetails(null);

    try {
      const response = await api.get(`/transactions/${transactionId}`);
      setTransactionDetails(response.data);
      setLoading(false);
    } catch (err) {
      const msg = err.message || "Transaction not found. Please check the ID.";
      setStatus(`error:${msg}`);
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setStatus("processing");

    try {
      await api.patch(`/transactions/${transactionId}/process`);

      setStatus("success");
      setTimeout(() => {
        setStatus(null);
        setTransactionId("");
        setTransactionDetails(null);
      }, 3000);
    } catch (err) {
      const msg = err.message || "Failed to process redemption. Please try again.";
      setStatus(`error:${msg}`);
    }
  };

  return (
    <>
      <PageMeta title="Process Redemption" />
      <PageBreadcrumb pageTitle="Process Redemption" />

      <div className="space-y-6">
        {/* Lookup Transaction */}
        <ComponentCard
          title="Lookup Transaction"
          desc="Enter a transaction ID to view and process redemption requests."
        >
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Transaction ID
              </label>
              <input
                type="text"
                pattern="^[0-9]+$"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the numeric transaction ID from the QR code or redemption request
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || status === "processing"}
            >
              {loading ? "Looking up..." : "Lookup Transaction"}
            </button>
          </form>
        </ComponentCard>

        {/* Transaction Details */}
        {transactionDetails && (
          <ComponentCard
            title="Transaction Details"
            desc="Review the transaction details below and process the redemption."
          >
            <div className="space-y-4">
              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Transaction ID</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    #{transactionDetails.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">User ID</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {transactionDetails.utorid}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Type</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {transactionDetails.type}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Amount</p>
                  <p className={`text-lg font-semibold ${
                    transactionDetails.amount < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {transactionDetails.amount > 0 ? '+' : ''}{transactionDetails.amount} points
                  </p>
                </div>

                {transactionDetails.redeemed && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Points Redeemed</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {transactionDetails.redeemed} points
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Created At</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(transactionDetails.createdAt).toLocaleString()}
                  </p>
                </div>

                {transactionDetails.remark && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Remark</p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {transactionDetails.remark}
                    </p>
                  </div>
                )}
              </div>

              {/* Suspicious Warning */}
              {transactionDetails.suspicious && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      This transaction has been flagged as suspicious
                    </p>
                  </div>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={handleProcess}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={status === "processing" || status === "success"}
              >
                {status === "processing" ? "Processing..." : status === "success" ? "Processed Successfully" : "Process Redemption"}
              </button>
            </div>
          </ComponentCard>
        )}

        {/* Status Messages */}
        {status === "processing" && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">Processing redemption...</p>
          </div>
        )}

        {status === "success" && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              Redemption processed successfully!
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
      </div>
    </>
  );
};

export default ProcessRedemptionPage;
