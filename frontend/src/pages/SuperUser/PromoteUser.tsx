import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useEffect, useState } from "react";

interface User {
  id: number;
  utorid: string;
  name: string;
  role: string;
}

function PromoteUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newRole, setNewRole] = useState("manager");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please log in as a superuser.");
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);

        const res = await fetch("http://localhost:3000/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load users.");
        const data = await res.json();

        setUsers(data.users || data);
      } catch (err: any) {
        setError(err.message || "Failed to load users.");
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

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please log in as a superuser.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      const res = await fetch(
        `http://localhost:3000/users/${selectedId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to promote user.");
      }

      setSuccess("User role updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to promote user.");
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
                onChange={(e) => setSelectedId(Number(e.target.value))}
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