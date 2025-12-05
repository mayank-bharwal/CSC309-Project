import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import api from "../../utils/api";

const PointsPage = () => {
  const [points, setPoints] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const data = await api.get("/users/me");
        setPoints(data.points);
      } catch (err) {
        setError(err.message || "Failed to load points.");
      }
    };

    fetchPoints();
  }, []);

  return (
    <>
      <PageMeta title="Available Points" />
      <PageBreadcrumb pageTitle="Available Points" />

      <ComponentCard title="Available Points" desc="Your current balance">
        {error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : points === null ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <p className="text-4xl font-bold">{points}</p>
        )}
      </ComponentCard>
    </>
  );
};

export default PointsPage;