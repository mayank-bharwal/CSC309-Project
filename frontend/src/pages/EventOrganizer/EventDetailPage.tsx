import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface EventDetail {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  [key: string]: any;
}

function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please log in to view this event.");
      return;
    }

    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`http://localhost:3000/events/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          let message = "Failed to load event.";
          try {
            const data = await res.json();
            if (data?.error) message = data.error;
          } catch {
          }
          throw new Error(message);
        }

        const data = await res.json();

        const dateFromBackend =
          typeof data.startTime === "string"
            ? data.startTime.slice(0, 10)
            : "";

        setEvent({
          id: data.id,
          name: data.name ?? "",
          date: dateFromBackend,
          location: data.location ?? "",
          description: data.description ?? "",
          ...data,
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load event.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleChange = (field: keyof EventDetail, value: string) => {
    if (!event) return;
    setEvent({ ...event, [field]: value });
  };

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please log in to save changes.");
      setSaving(false);
      return;
    }

    try {
      const startTime =
        event.date && event.date.trim() !== ""
          ? `${event.date}T00:00:00`
          : undefined;

      const res = await fetch(
        `http://localhost:3000/events/${event.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: event.name,
            description: event.description,
            location: event.location,
            ...(startTime ? { startTime } : {}),
          }),
        }
      );

      if (!res.ok) {
        let message = "Failed to save changes.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
        }
        throw new Error(message);
      }

      const updated = await res.json();

      const updatedDate =
        typeof updated.startTime === "string"
          ? updated.startTime.slice(0, 10)
          : event.date;

      setEvent({
        ...event,
        ...updated,
        date: updatedDate,
      });

      setSaving(false);
      alert("Event saved successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save changes.");
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="Event Details" description="View and edit this event" />
      <PageBreadcrumb pageTitle="Event Details" />

        <ComponentCard title={`Event Details ${eventId ? `#${eventId}` : ""}`}>
          {error && <p style={{ color: "red" }}>{error}</p>}

          {loading && !error && <p>Loading event...</p>}

          {event && !loading && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div style={{ marginBottom: "12px" }}>
                <label>
                  Name:
                  <input
                    type="text"
                    value={event.name}
                    onChange={(e) =>
                      handleChange("name", e.target.value)
                    }
                    style={{ marginLeft: "8px", width: "100%" }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label>
                  Date:
                  <input
                    type="date"
                    value={event.date}
                    onChange={(e) =>
                      handleChange("date", e.target.value)
                    }
                    style={{ marginLeft: "8px" }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label>
                  Location:
                  <input
                    type="text"
                    value={event.location}
                    onChange={(e) =>
                      handleChange("location", e.target.value)
                    }
                    style={{ marginLeft: "8px", width: "100%" }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label>
                  Description:
                  <textarea
                    value={event.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    style={{
                      marginTop: "4px",
                      width: "100%",
                      minHeight: "80px",
                    }}
                  />
                </label>
              </div>

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {!event && !loading && !error && (
            <p>Event not found.</p>
          )}
        </ComponentCard>
    </>
  );
}

export default EventDetailPage;