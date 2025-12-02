import { useState, FormEvent } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import GridShape from "../../components/common/GridShape";

export default function TransferPage() {
  const [recipientId, setRecipientId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch(`/users/${recipientId}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          type: "transfer",
          amount: Number(amount),
          remark: remark || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(`Error: ${data.error || "Transaction failed"}`);
        return;
      }

      setStatus("success");
      setRecipientId("");
      setAmount("");
      setRemark("");
    } catch (err) {
      setStatus("Error: Network failure");
    }
  };

  return (
    <>
      <PageMeta title="Transfer Points"
      description="Transfer your loyalty points."
      />

      <div className="relative p-6 min-h-screen bg-gray-50">
        <GridShape />

        <div className="mx-auto max-w-6xl">
          <PageBreadcrumb pageTitle="Transfer Points" />

          <ComponentCard
            title="Transfer Points"
            desc="Send your loyalty points to another user by entering their User ID."
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Recipient User ID
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  required
                />
              </div>

              {/* Remark */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Remark (Optional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Send Points
              </button>

              {/* Status Message */}
              {status === "loading" && (
                <p className="text-blue-600 text-sm font-medium">
                  Processing transaction...
                </p>
              )}
              {status === "success" && (
                <p className="text-green-600 text-sm font-semibold">
                  Transfer successful!
                </p>
              )}
              {status && status.startsWith("Error") && (
                <p className="text-red-600 text-sm font-medium">{status}</p>
              )}
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}