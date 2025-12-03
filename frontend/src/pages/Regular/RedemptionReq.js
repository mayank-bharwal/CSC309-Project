import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import api from "../../utils/api";

const RedemptionReq = () => {
  const [promotions, setPromotions] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPromos = async () => {
      try {
        const data = await api.get("/users/me");
        setPromotions(data.promotions || []);
      } catch (err) {
        setError(err.message || "Failed to load promotions.");
      }
    };

    loadPromos();
  }, []);

  const handleRedeem = async () => {
    if (!selectedPromo) return;

    try {
      const data = await api.post("/users/me/transactions", {
        promotionId: selectedPromo,
      });
      setTransaction(data);
    } catch (err) {
      setError(err.message || "Failed to redeem promotion.");
    }
  };

  const qrPayload =
    transaction &&
    JSON.stringify({
      type: "redemption",
      transactionId: transaction.id,
      promotionId: selectedPromo,
    });

  return (
    <>
      <PageMeta title="Redeem Points" />
      <PageBreadcrumb pageTitle="Redeem Points" />

      <ComponentCard
        title="Redeem Points"
        desc="Choose a promotion to generate a redemption QR code."
      >
        {error && (
          <p className="text-red-600 text-sm font-medium mb-3">{error}</p>
        )}

        <div className="flex flex-col gap-4">
          <label className="font-medium text-gray-700">
            Select a Promotion
          </label>

          <select
            className="border rounded-lg p-3 bg-white"
            value={selectedPromo || ""}
            onChange={(e) => setSelectedPromo(Number(e.target.value))}
          >
            <option value="" disabled>
              Select a promotion
            </option>
            {promotions.map((promo) => (
              <option key={promo.id} value={promo.id}>
                {promo.name} — {promo.points} pts
              </option>
            ))}
          </select>

          <button
            onClick={handleRedeem}
            disabled={!selectedPromo}
            className={`px-4 py-2 rounded-lg text-white font-semibold 
              ${
                selectedPromo
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            Redeem
          </button>
        </div>

        {transaction && (
          <div className="mt-8 text-center border-t pt-6">
            <h3 className="text-lg font-medium mb-3">Redemption QR Code</h3>

            <QRCodeSVG value={qrPayload} size={220} level="H" />

            <p className="text-gray-600 text-sm mt-3">
              Transaction ID: {transaction.id}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Show this QR code to the cashier to finalize the redemption.
            </p>
          </div>
        )}
      </ComponentCard>
    </>
  );
};

export default RedemptionReq;