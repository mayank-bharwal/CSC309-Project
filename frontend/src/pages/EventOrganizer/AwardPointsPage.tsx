import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";

type RecipientType = "single" | "all";

const AwardPointsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [recipientType, setRecipientType] = useState<RecipientType>("single");
  const [utorid, setUtorid] = useState("");
  const [points, setPoints] = useState<string>("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!eventId) {
      setError("No event selected.");
      return;
    }

    if (!points.trim() || Number(points) <= 0) {
      setError("Please enter a positive number of points.");
      return;
    }

    if (recipientType === "single" && !utorid.trim()) {
      setError("Please enter a UTORid for the guest.");
      return;
    }

    setLoading(true);

    try {
      const body: any = {
        points: Number(points),
        remark: remark || undefined,
        recipientType,
      };

      if (recipientType === "single") {
        body.utorid = utorid.trim();
      }

      await api.post(`/events/${eventId}/transactions`, body);

      setSuccess("Points awarded successfully!");
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to award points.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Award Points" description="Award loyalty points to guests" />
      <PageBreadcrumb pageTitle="Award Points" />

        <ComponentCard
          title={
            eventId ? `Award Points for Event #${eventId}` : "Award Points"
          }
        >
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "12px" }}>
              <label>
                <input
                  type="radio"
                  name="recipientType"
                  value="single"
                  checked={recipientType === "single"}
                  onChange={() => setRecipientType("single")}
                  style={{ marginRight: "4px" }}
                />
                Single guest
              </label>

            <label style={{ marginLeft: "16px" }}>
                <input
                  type="radio"
                  name="recipientType"
                  value="all"
                  checked={recipientType === "all"}
                  onChange={() => setRecipientType("all")}
                  style={{ marginRight: "4px" }}
                />
                All guests who have RSVPed
              </label>
            </div>

            {recipientType === "single" && (
              <div style={{ marginBottom: "12px" }}>
                <label>
                  Guest UTORid:
                  <input
                    type="text"
                    value={utorid}
                    onChange={(e) => setUtorid(e.target.value)}
                    style={{ marginLeft: "8px", width: "100%" }}
                    placeholder="e.g. johndoe"
                  />
                </label>
              </div>
            )}

            <div style={{ marginBottom: "12px" }}>
              <label>
                Points to award:
                <input
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  style={{ marginLeft: "8px", width: "120px" }}
                  required
                />
              </label>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label>
                Remark (optional):
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  style={{ marginLeft: "8px", width: "100%" }}
                  placeholder="Reason for awarding points"
                />
              </label>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Awarding..." : "Award Points"}
            </button>
          </form>
        </ComponentCard>
    </>
  );
}

export default AwardPointsPage;
