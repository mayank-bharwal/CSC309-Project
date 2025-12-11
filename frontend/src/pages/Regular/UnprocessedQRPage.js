import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import api from "../../utils/api";

const UnprocessedQRPage = () => {
  const [redemption, setRedemption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUnprocessedRedemption = async () => {
      try {
        const res = await api.get(
          "/users/me/transactions?type=redemption&limit=50"
        );

        const transactions = res.results || [];

        // Unprocessed redemption = redeemed field is NOT set
        const pending = transactions
          .filter(
            (t) =>
              t.type === "redemption" &&
              t.redeemed == null
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt) - new Date(a.createdAt)
          )[0];

        setRedemption(pending || null);
      } catch (err) {
        setError("Failed to load redemption request.");
      } finally {
        setLoading(false);
      }
    };

    loadUnprocessedRedemption();
  }, []);

  const qrPayload = redemption
    ? JSON.stringify({
        type: "redemption",
        transactionId: redemption.id,
      })
    : "";

  return (
    <>
      <PageMeta title="Pending Redemption" />
      <PageBreadcrumb pageTitle="Pending Redemption" />

      <ComponentCard
        title="Pending Redemption"
        desc="Show this QR code to a cashier to complete your redemption."
      >
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading...
          </p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400 text-sm">
            {error}
          </p>
        ) : !redemption ? (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            You have no unprocessed redemption requests.
          </p>
        ) : (
          <div className="flex flex-col items-center py-8">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <QRCodeSVG
                value={qrPayload}
                size={220}
                level="H"
              />
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm">
              Present this QR code to a cashier to process your redemption.
            </p>
          </div>
        )}
      </ComponentCard>
    </>
  );
};

export default UnprocessedQRPage;