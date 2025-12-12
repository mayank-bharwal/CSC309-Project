import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";

const MyEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/events?showFull=true");
        const data = res.data;

        const list = Array.isArray(data?.results) ? data.results : data;

        const mapped = (list || []).map((evt) => {
          const date =
            typeof evt.startTime === "string"
              ? evt.startTime.slice(0, 10)
              : "";

          return {
            id: evt.id,
            name: evt.name ?? "",
            date,
            location: evt.location ?? "",
            capacity: evt.capacity ?? null,
            numGuests: evt.numGuests ?? 0,
            pointsRemain: evt.pointsRemain,
            pointsAwarded: evt.pointsAwarded,
            published: evt.published,
            ...evt,
          };
        });

        setEvents(mapped);
      } catch (err) {
        console.error(err);
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load events.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <>
      <PageMeta title="My Events" description="Events you are responsible for" />
      <PageBreadcrumb pageTitle="My Events" />

      <ComponentCard title="Events You Are Responsible For">
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading && !error && <p>Loading events...</p>}

        {!loading && !error && events.length === 0 && (
          <p>You are not responsible for any events yet.</p>
        )}

        {!loading && !error && events.length > 0 && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "12px",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px" }}>Name</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Date</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Location</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Guests</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Capacity</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => (
                <tr key={evt.id}>
                  <td style={{ padding: "8px", borderTop: "1px solid #eee" }}>
                    {evt.name}
                  </td>
                  <td style={{ padding: "8px", borderTop: "1px solid #eee" }}>
                    {evt.date || "—"}
                  </td>
                  <td style={{ padding: "8px", borderTop: "1px solid #eee" }}>
                    {evt.location || "—"}
                  </td>
                  <td style={{ padding: "8px", borderTop: "1px solid #eee" }}>
                    {evt.numGuests}
                  </td>
                  <td style={{ padding: "8px", borderTop: "1px solid #eee" }}>
                    {evt.capacity === null
                      ? "No limit"
                      : `${evt.numGuests}/${evt.capacity}`}
                  </td>
                  <td style={{ padding: "8px", borderTop: "1px solid #eee" }}>
                    <Link to={`/event-organizer/events/${evt.id}`}>View / Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ComponentCard>
    </>
  );
};

export default MyEventsPage;