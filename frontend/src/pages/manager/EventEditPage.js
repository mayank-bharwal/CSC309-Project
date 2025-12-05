import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadcrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const EventEditPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showAddOrganizerModal, setShowAddOrganizerModal] = useState(false);
  const [newUserUtorid, setNewUserUtorid] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [points, setPoints] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await api.get(`/events/${eventId}`);
        setEvent(data);
        setName(data.name || '');
        setDescription(data.description || '');
        setLocation(data.location || '');
        setStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : '');
        setEndTime(data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : '');
        setCapacity(data.capacity?.toString() || '');
        setPoints(data.points?.toString() || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const hasStarted = event && new Date(event.startTime) <= new Date();
  const hasEnded = event && new Date(event.endTime) <= new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = {};

      if (name !== event.name) data.name = name;
      if (description !== event.description) data.description = description;
      if (location !== event.location) data.location = location;
      if (startTime && new Date(startTime).toISOString() !== new Date(event.startTime).toISOString()) {
        data.startTime = new Date(startTime).toISOString();
      }
      if (endTime && new Date(endTime).toISOString() !== new Date(event.endTime).toISOString()) {
        data.endTime = new Date(endTime).toISOString();
      }

      const newCapacity = capacity ? parseInt(capacity) : null;
      if (newCapacity !== event.capacity) data.capacity = newCapacity;

      const newPoints = points ? parseInt(points) : null;
      if (newPoints !== event.points) data.points = newPoints;

      if (Object.keys(data).length === 0) {
        setError('No changes to save');
        setSaving(false);
        return;
      }

      const result = await api.patch(`/events/${eventId}`, data);
      setEvent((prev) => ({ ...prev, ...result }));
      setSuccess('Event updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setError('');

    try {
      await api.patch(`/events/${eventId}`, { published: true });
      setEvent((prev) => ({ ...prev, published: true }));
      setSuccess('Event published successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      await api.delete(`/events/${eventId}`);
      navigate('/manager/events');
    } catch (err) {
      setError(err.message);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    setError('');

    try {
      await api.post(`/events/${eventId}/guests`, { utorid: newUserUtorid });
      const data = await api.get(`/events/${eventId}`);
      setEvent(data);
      setSuccess('Guest added successfully');
      setShowAddGuestModal(false);
      setNewUserUtorid('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveGuest = async (userId) => {
    try {
      await api.delete(`/events/${eventId}/guests/${userId}`);
      const data = await api.get(`/events/${eventId}`);
      setEvent(data);
      setSuccess('Guest removed successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddOrganizer = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    setError('');

    try {
      await api.post(`/events/${eventId}/organizers`, { utorid: newUserUtorid });
      const data = await api.get(`/events/${eventId}`);
      setEvent(data);
      setSuccess('Organizer added successfully');
      setShowAddOrganizerModal(false);
      setNewUserUtorid('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveOrganizer = async (userId) => {
    try {
      await api.delete(`/events/${eventId}/organizers/${userId}`);
      const data = await api.get(`/events/${eventId}`);
      setEvent(data);
      setSuccess('Organizer removed successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = () => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (end < now) return <Badge variant="default">Ended</Badge>;
    if (start > now) return <Badge variant="info">Upcoming</Badge>;
    return <Badge variant="success">In Progress</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <>
        <PageMeta title="Event Not Found" description="Event not found" />
        <PageBreadcrumb pageTitle="Event Not Found" items={[{ label: 'Events', path: '/manager/events' }]} />
        <Alert type="error">Event not found</Alert>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Edit: ${event.name}`} description="Edit event details" />
      <PageBreadcrumb
        pageTitle="Edit Event"
        items={[{ label: 'Events', path: '/manager/events' }]}
      />

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" className="mb-6" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <ComponentCard title="Event Info">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
                <p className="font-mono text-gray-800 dark:text-white">#{event.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <div className="flex gap-2 mt-1">
                  {getStatusBadge()}
                  <Badge variant={event.published ? 'success' : 'warning'}>
                    {event.published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Guests</p>
                <p className="text-gray-800 dark:text-white">
                  {event.guests?.length || 0} / {event.capacity || '∞'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
                <p className="text-gray-800 dark:text-white">
                  Remaining: <span className="font-bold text-brand-500">{event.pointsRemain}</span>
                </p>
                <p className="text-sm text-gray-500">Awarded: {event.pointsAwarded}</p>
              </div>

              {!event.published && (
                <Button onClick={handlePublish} disabled={saving} className="w-full">
                  {saving ? 'Publishing...' : 'Publish Event'}
                </Button>
              )}

              {!event.published && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Event
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Only unpublished events can be deleted
                  </p>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Organizers */}
          <ComponentCard
            title="Organizers"
            actions={
              <Button size="sm" onClick={() => setShowAddOrganizerModal(true)}>
                Add
              </Button>
            }
          >
            {event.organizers?.length > 0 ? (
              <div className="space-y-2">
                {event.organizers.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{org.name}</p>
                      <p className="text-sm text-gray-500">{org.utorid}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveOrganizer(org.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No organizers yet</p>
            )}
          </ComponentCard>
        </div>

        {/* Edit Form & Guests */}
        <div className="lg:col-span-2 space-y-6">
          <ComponentCard title="Edit Details">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Event Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={hasStarted}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                  rows={3}
                  disabled={hasStarted}
                  required
                />
              </div>

              <Input
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={hasStarted}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                    disabled={hasStarted}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                    disabled={hasEnded}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Leave empty for unlimited"
                  disabled={hasStarted}
                />
                <Input
                  label="Total Points Budget"
                  type="number"
                  min="1"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/manager/events')}
                >
                  Back to List
                </Button>
              </div>
            </form>
          </ComponentCard>

          {/* Guests */}
          <ComponentCard
            title={`Guests (${event.guests?.length || 0})`}
            actions={
              <Button size="sm" onClick={() => setShowAddGuestModal(true)}>
                Add Guest
              </Button>
            }
          >
            {event.guests?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {event.guests.map((guestId) => (
                  <div
                    key={guestId}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="text-gray-800 dark:text-white">User #{guestId}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveGuest(guestId)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No guests yet</p>
            )}
          </ComponentCard>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Event"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete "{event.name}"? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>

      {/* Add Guest Modal */}
      <Modal
        isOpen={showAddGuestModal}
        onClose={() => setShowAddGuestModal(false)}
        title="Add Guest"
      >
        <form onSubmit={handleAddGuest} className="space-y-4">
          <Input
            label="User UTORid"
            value={newUserUtorid}
            onChange={(e) => setNewUserUtorid(e.target.value)}
            placeholder="Enter UTORid"
            required
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowAddGuestModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addingUser}>
              {addingUser ? 'Adding...' : 'Add Guest'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Organizer Modal */}
      <Modal
        isOpen={showAddOrganizerModal}
        onClose={() => setShowAddOrganizerModal(false)}
        title="Add Organizer"
      >
        <form onSubmit={handleAddOrganizer} className="space-y-4">
          <Input
            label="User UTORid"
            value={newUserUtorid}
            onChange={(e) => setNewUserUtorid(e.target.value)}
            placeholder="Enter UTORid"
            required
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowAddOrganizerModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addingUser}>
              {addingUser ? 'Adding...' : 'Add Organizer'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default EventEditPage;

