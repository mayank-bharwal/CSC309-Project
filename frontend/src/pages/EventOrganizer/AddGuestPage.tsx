import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useState } from "react";
import { useParams } from "react-router-dom";

function AddGuestPage() {
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

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please log in to add guests.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:3000/events/${eventId}/guests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ utorid: utorid.trim() }),
        }
      );

      if (!res.ok) {
        let message = "Failed to add guest.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
        }
        throw new Error(message);
      }

      await res.json();

      setSuccess(`Successfully added "${utorid.trim()}" to this event.`);
      setUtorid("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add guest.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Add Guest" description="Add a guest to this event" />
      <PageBreadcrumb pageTitle="Add Guest" />

        <ComponentCard
          title={
            eventId ? `Add Guest to Event #${eventId}` : "Add Guest to Event"
          }
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
}

export default AddGuestPage;
