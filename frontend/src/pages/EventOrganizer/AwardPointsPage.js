import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";

const AwardPointsPage = () => {
  const { eventId } = useParams();

  const [recipientType, setRecipientType] = useState("single");
  const [utorid, setUtorid] = useState("");
  const [points, setPoints] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
      const body = {
        points: Number(points),
        remark: remark || undefined,
        recipientType,
      };

      if (recipientType === "single") {
        body.utorid = utorid.trim();
      }

      await api.post(`/events/${eventId}/transactions`, body);

      setSuccess("Points awarded successfully!");
    } catch (err) {
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