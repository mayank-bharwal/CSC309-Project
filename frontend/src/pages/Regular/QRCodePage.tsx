import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import GridShape from "../../components/common/GridShape";
import { QRCodeSVG } from "qrcode.react";

type User = {
  id: number;
  name: string;
  email: string;
  utorid?: string;
  points?: number;
};

export default function QRCodePage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/users/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to fetch user");
        }
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => {
        console.error("Error fetching user:", err);
        setError(err.message);
      });
  }, []);

  // --- Error state ---
  if (error) {
    return (
      <div className="p-6">
        <PageMeta title="My QR Code" description="QR code for user identity" />
        <p className="text-red-600 font-medium">
          Error: {error}
          <br />
          Ensure you're logged in and that your backend session is valid.
        </p>
      </div>
    );
  }

  // --- Loading State ---
  if (!user) {
    return (
      <div className="p-6">
        <PageMeta title="My QR Code" description="QR code for user identity" />
        <p>Loading...</p>
      </div>
    );
  }

  // --- QR Payload ---
  const qrPayload = JSON.stringify({
    type: "user",
    userId: user.id,
  });

  return (
    <>
      <PageMeta
        title="My QR Code"
        description="Scan this QR code to initiate a transfer or purchase transaction."
      />

      <div className="relative p-6 min-h-screen bg-gray-50">
        <GridShape />

        <div className="mx-auto max-w-6xl">
          <PageBreadcrumb pageTitle="My QR Code" />

          <ComponentCard
            title="My QR Code"
            desc="Scan this QR to initiate a transfer or purchase transaction."
          >
            <div className="flex flex-col items-center gap-4 py-6">
              <QRCodeSVG value={qrPayload} size={220} level="H" />

              <p className="text-gray-600 text-sm">
                User ID encoded: <b>{user.id}</b>
              </p>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}