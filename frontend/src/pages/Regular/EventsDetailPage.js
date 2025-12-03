import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Loading from "../../components/common/Loading";
import Alert from "../../components/common/Alert";
import api from "../../utils/api";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../context/AuthContext";

const EventsDetailPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await api.get(`/events/${eventId}`);
        setEvent(data);
      } catch (err) {
        setError(err.message || "Failed to load event.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) return <Loading className="py-10" />;

  if (error) {
    return (
      <>
        <PageMeta title="Event Not Found" />
        <Alert type="error">{error}</Alert>
      </>
    );
  }

  // Prepare QR Payload
  const qrPayload = JSON.stringify({
    type: "event",
    eventId: Number(eventId),
    userId: user?.id,
  });

  return (
    <>
      <PageMeta title={event.name} />

      <PageBreadcrumb pageTitle={event.name} />

      <ComponentCard title="Event Information">
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          
          <p>
            <strong>Description:</strong> {event.description || "No description"}
          </p>

          <p>
            <strong>Location:</strong> {event.location}
          </p>

          <p>
            <strong>Start:</strong>{" "}
            {new Date(event.startTime).toLocaleString()}
          </p>

          <p>
            <strong>End:</strong>{" "}
            {new Date(event.endTime).toLocaleString()}
          </p>

          <p>
            <strong>Capacity:</strong> {event.capacity ?? "Unlimited"}
          </p>

          <p>
            <strong>Guests RSVPed:</strong> {event.numGuests}
          </p>

          <div>
            <strong>Organizers:</strong>
            <ul className="list-disc ml-6 mt-1">
              {event.organizers.map((org) => (
                <li key={org.id}>{org.name} ({org.utorid})</li>
              ))}
            </ul>
          </div>
        </div>
      </ComponentCard>

      {/* QR Code for Manager/Organizer RSVP + Attendance */}
      <ComponentCard
        title="Event QR Code"
        desc="Show this QR code to a manager or event organizer to RSVP and confirm your attendance."
      >
        <div className="flex flex-col items-center py-6">
          <QRCodeSVG value={qrPayload} size={220} level="H" />

          <p className="text-gray-600 text-sm mt-4">
            Event ID: <b>{eventId}</b>
          </p>

          <p className="text-gray-500 text-xs mt-2 text-center">
            This QR allows event staff to RSVP you and award points.
          </p>
        </div>
      </ComponentCard>
    </>
  );
};

export default EventsDetailPage;