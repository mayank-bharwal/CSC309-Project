import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import GridShape from "../../components/common/GridShape";
import { QRCodeSVG } from "qrcode.react";

// ---------- Types ----------
type Promotion = {
  id: number;
  name: string;
  points: number | null;
  minSpending?: number | null;
  rate?: number | null;
};

type Transaction = {
  id: number;
  promotionId?: number;
};

export default function RedemptionReq() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<number | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------- Fetch promotions ----------
  useEffect(() => {
    fetch("http://localhost:3000/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load user data");
        }
        return res.json();
      })
      .then((data) => {
        setPromotions(data.promotions || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ---------- Redeem promotion ----------
  const handleRedeem = () => {
    if (!selectedPromo) return;

    fetch("http://localhost:3000/users/me/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ promotionId: selectedPromo }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to redeem promotion");
        }
        return res.json();
      })
      .then((data) => setTransaction(data))
      .catch((err) => setError(err.message));
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (error) {
    return (
      <div className="p-6 text-red-600">
        <PageMeta title="Redeem Points" description="" />
        Error: {error}
        <br />
        Ensure your token is valid.
      </div>
    );
  }

  // ---------- QR payload ----------
  const qrPayload =
    transaction &&
    JSON.stringify({
      type: "redemption",
      transactionId: transaction.id,
      promotionId: selectedPromo,
    });

  return (
    <>
      <PageMeta title="Redeem Points" description="" />

      <div className="relative p-6 min-h-screen bg-gray-50">
        <GridShape />

        <div className="mx-auto max-w-6xl">
          <PageBreadcrumb pageTitle="Redeem Points" />

          <ComponentCard
            title="Redeem Points"
            desc="Select a promotion to redeem your points for rewards."
          >
            {/* Selection Dropdown */}
            <div className="flex flex-col gap-4 mb-6">
              <label className="font-medium text-gray-700">
                Select a Promotion
              </label>

              <select
                className="border rounded-lg p-3 bg-white"
                defaultValue=""
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

            {/* QR Code Output */}
            {transaction && (
              <div className="mt-8 text-center">
                <h3 className="text-lg font-medium mb-3">
                  Redemption QR Code
                </h3>

                {qrPayload && (
                  <div className="mt-8 text-center">
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

                <p className="text-gray-600 text-sm mt-3">
                  Transaction ID: {transaction.id}
                </p>

                <p className="text-gray-500 text-xs mt-1">
                  Show this QR code to the cashier to finalize redemption.
                </p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </>
  );
}