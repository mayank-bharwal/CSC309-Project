import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";

const AddGuestPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [utorid, setUtorid] = useState("");
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

    if (!utorid.trim()) {
      setError("Please enter a UTORid.");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/events/${eventId}/guests`, {
        utorid: utorid.trim(),
      });

      setSuccess(`Successfully added "${utorid.trim()}" to this event.`);
      setUtorid("");
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to add guest.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Add Guest" />
      <PageBreadcrumb pageTitle="Add Guest" />

        <ComponentCard
          title={eventId ? `Add Guest to Event #${eventId}` : "Add Guest to Event"}
        >
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "12px" }}>
              <label>
                UTORid:
                <input
                  type="text"
                  value={utorid}
                  onChange={(e) => setUtorid(e.target.value)}
                  style={{ marginLeft: "8px", width: "100%" }}
                  placeholder="e.g. johndoe"
                />
              </label>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Guest"}
            </button>
          </form>
        </ComponentCard>
    </>
  );
};

export default AddGuestPage;