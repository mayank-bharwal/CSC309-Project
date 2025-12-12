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
      <PageMeta title="Points" description="View your current points balance" />
      <PageBreadcrumb pageTitle="Points" />

      <ComponentCard title="Available Points" desc="Your current balance">
        {error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {points === null && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading points...
          </p>
        )}

        {points !== null && !error && (
          <div className="mt-2">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {points}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Total available points
            </p>
          </div>
        )}
      </ComponentCard>
    </>
  );
};

export default PointsPage;