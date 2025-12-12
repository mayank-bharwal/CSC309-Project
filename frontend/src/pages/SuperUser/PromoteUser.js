import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";

import React, { useEffect, useState } from "react";
import api from "../../utils/api";

function PromoteUserPage() {
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [newRole, setNewRole] = useState("manager");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/users");
        const data = res.data;

        const list = data.users ?? data;
        setUsers(list || []);
      } catch (err) {
        console.error(err);
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load users.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handlePromote = async () => {
    if (!selectedId) {
      setError("Please select a user to promote.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      await api.patch(`/users/${selectedId}/role`, { role: newRole });

      setSuccess("User role updated successfully.");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to promote user.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Promote User" description="Superuser role management" />
      <PageBreadcrumb pageTitle="Promote User" />

      <ComponentCard title="Superuser: Promote a User">
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        {loading && <p>Loading...</p>}

        {/* USERS DROPDOWN */}
        <div style={{ marginBottom: "12px" }}>
          <label>
            Select User:
            <select
              value={selectedId ?? ""}
              onChange={(e) =>
                setSelectedId(e.target.value ? Number(e.target.value) : null)
              }
              style={{ marginLeft: "8px", width: "100%" }}
            >
              <option value="">-- Choose a user --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.utorid}) — current role: {u.role}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* ROLE SELECTION */}
        <div style={{ marginBottom: "12px" }}>
          <label>
            New Role:
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{ marginLeft: "8px", width: "100%" }}
            >
              <option value="manager">Manager</option>
              <option value="superuser">Superuser</option>
            </select>
          </label>
        </div>

        {/* BUTTON */}
        <button disabled={loading} onClick={handlePromote}>
          {loading ? "Updating..." : "Promote User"}
        </button>
      </ComponentCard>
    </>
  );
}

export default PromoteUserPage;