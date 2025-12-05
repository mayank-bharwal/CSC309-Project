import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface EventSummary {
  id: number;
  name: string;
  date: string;
  location: string;
  capacity: number | null;
  numGuests: number;
  pointsRemain?: number;
  pointsAwarded?: number;
  published?: boolean;
  [key: string]: any;
}

function MyEventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("Please log in to view your events.");
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          "http://localhost:3000/events?showFull=true",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          let message = "Failed to load events.";
          try {
            const data = await res.json();
            if (data?.error) message = data.error;
          } catch {
          }
          throw new Error(message);
        }

        const data = await res.json();

        const mapped: EventSummary[] = (data.results || []).map(
          (evt: any) => {
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
          }
        );

        setEvents(mapped);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load events.");
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
                  <th style={{ textAlign: "left", padding: "8px" }}>
                    Location
                  </th>
                  <th style={{ textAlign: "left", padding: "8px" }}>
                    Guests
                  </th>
                  <th style={{ textAlign: "left", padding: "8px" }}>
                    Capacity
                  </th>
                  <th style={{ textAlign: "left", padding: "8px" }}>
                    Actions
                  </th>
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
                      <Link to={`/events/${evt.id}`}>View / Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ComponentCard>
    </>
  );
}

export default MyEventsPage;