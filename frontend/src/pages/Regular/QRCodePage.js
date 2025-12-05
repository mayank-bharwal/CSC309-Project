import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import api from "../../utils/api";

const QRCodePage = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await api.get("/users/me");
        setUser(data);
      } catch (err) {
        setError(err.message || "Failed to load user.");
      }
    };

    loadUser();
  }, []);

  const qrPayload = user
    ? JSON.stringify({
        type: "user",
        userId: user.id,
      })
    : "";

  return (
    <>
      <PageMeta title="My QR Code" />
      <PageBreadcrumb pageTitle="My QR Code" />

      <ComponentCard
        title="My QR Code"
        desc="Scan this QR to initiate a transfer or purchase."
      >
        {error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : !user ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6">
            <QRCodeSVG value={qrPayload} size={220} level="H" />
            <p className="text-gray-600 text-sm">
              User ID encoded: <b>{user.id}</b>
            </p>
          </div>
        )}
      </ComponentCard>
    </>
  );
};

export default QRCodePage;