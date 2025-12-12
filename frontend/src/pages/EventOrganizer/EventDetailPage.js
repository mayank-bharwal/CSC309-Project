import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import api from "../../utils/api";

const EventDetailPage = () => {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setError("No event selected.");
      return;
    }

    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/events/${eventId}`);
        const data = res.data;

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
      } catch (err) {
        console.error(err);
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load event.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleChange = (field, value) => {
    if (!event) return;
    setEvent({
      ...event,
      [field]: value,
    });
  };

  const handleSave = async () => {
    if (!event) return;

    setSaving(true);
    setError(null);

    try {
      const startTime =
        event.date && event.date.trim() !== ""
          ? `${event.date}T00:00:00`
          : undefined;

      const body = {
        name: event.name,
        description: event.description,
        location: event.location,
      };

      if (startTime) {
        body.startTime = startTime;
      }

      const res = await api.patch(`/events/${event.id}`, body);
      const updated = res.data;

      const updatedDate =
        typeof updated.startTime === "string"
          ? updated.startTime.slice(0, 10)
          : event.date;

      setEvent({
        ...event,
        ...updated,
        date: updatedDate,
      });

      alert("Event saved successfully.");
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save changes.";
      setError(message);
    } finally {
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
          <>
            {/* Organizer actions */}
            <div style={{ marginBottom: "12px" }}>
              <Link to={`/event-organizer/events/${eventId}/add-guest`}>
                Add Guest
              </Link>
              {" | "}
              <Link to={`/event-organizer/events/${eventId}/award-points`}>
                Award Points
              </Link>
            </div>

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
          </>
        )}

        {!event && !loading && !error && <p>Event not found.</p>}
      </ComponentCard>
    </>
  );
};

export default EventDetailPage;