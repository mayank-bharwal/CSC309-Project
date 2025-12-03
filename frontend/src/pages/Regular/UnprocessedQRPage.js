import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Alert from "../../components/common/Alert";
import Loading from "../../components/common/Loading";
import { QRCodeSVG } from "qrcode.react";
import api from "../../utils/api";

export default function UnprocessedRedemptionPage() {
  const [tx, setTx] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.get("/users/me/transactions", {
          type: "redemption"
        });
        const txs = data.results;

        const unprocessed = txs.filter(t => t.type === "redemption" && t.redeemed == null);

        if (unprocessed.length === 0) {
          setError("No unprocessed redemption requests found.");
        } else {
          setTx(unprocessed[0]);
        }
      } catch (err) {
        setError(err.message || "Failed to load redemption requests.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <Loading className="py-12" />;

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }

  const qrPayload = JSON.stringify({
    type: "redemption",
    transactionId: tx.id,
    promotionId: tx.promotionIds?.[0]
  });

  return (
    <>
      <PageMeta title="Unprocessed Redemption Request" />

      <ComponentCard
        title="Your Redemption QR Code"
        desc="Present this QR code to the cashier to complete your redemption."
      >
        <div className="flex flex-col items-center space-y-4 py-6">
          <QRCodeSVG value={qrPayload} size={220} level="H" />

          <p className="text-gray-600 text-sm">
            Transaction ID: {tx.id}
          </p>
        </div>
      </ComponentCard>
    </>
  );
}