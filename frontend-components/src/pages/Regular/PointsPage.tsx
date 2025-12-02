import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import GridShape from "../../components/common/GridShape";
import { useEffect, useState } from "react";


interface UserResponse {
  id: number;
  points: number;
  promotions: any[];
  [key: string]: any;
}

const PointsPage = () => {
  const [points, setPoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("No auth token found. Please log in.");
      return;
    }

    fetch("http://localhost:3000/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to fetch user data");
        }
        return res.json() as Promise<UserResponse>;
      })
      .then((data) => {
        setPoints(data.points);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  return (
    <>
      <PageMeta 
        title="Available Points"
        description="Displays the total points available in your account."
      />

      <div className="relative p-6 min-h-screen bg-gray-50">
        <GridShape />

        <div className="mx-auto max-w-6xl">
          <PageBreadcrumb pageTitle="Available Points" />

          <ComponentCard
            title="Available Points"
            desc="Your current balance"
          >
            {error ? (
              <p className="text-red-600 text-lg">{error}</p>
            ) : (
              <p className="text-4xl font-bold text-center mt-4">
                {points !== null ? points : "Loading..."}
              </p>
            )}
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default PointsPage;