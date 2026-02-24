import { useState, useEffect } from "react";
import { userService, opdService } from "../services";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [opds, setOpds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "VIEWER",
    opdId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, opdsData] = await Promise.all([
        userService.getAll(),
        opdService.getAll(),
      ]);
      setUsers(usersData);
      setOpds(opdsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await userService.update(editingUser.id, updateData);
      } else {
        await userService.create(formData);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        email: "",
        password: "",
        name: "",
        role: "VIEWER",
        opdId: "",
      });
      loadData();
    } catch (error) {
      console.error("Failed to save user:", error);
      alert("Gagal menyimpan data");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      name: user.name,
      role: user.role,
      opdId: user.opdId || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus user ini?")) return;

    try {
      await userService.delete(id);
      loadData();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Gagal menghapus user");
    }
  };

  const handleUpdateStatus = async (id, currentStatus, newStatus) => {
    if (currentStatus === (newStatus === "active")) return;

    const action = newStatus === "active" ? "mengaktifkan" : "menonaktifkan";
    if (!window.confirm(`Apakah Anda yakin ingin ${action} user ini?`)) {
      loadData();
      return;
    }

    try {
      await userService.toggleStatus(id);
      loadData();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Gagal mengubah status user");
      loadData();
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: "badge bg-red-100 text-red-800",
      OPD: "badge bg-blue-100 text-blue-800",
      VIEWER: "badge bg-gray-100 text-gray-800",
    };
    return badges[role] || "badge";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Pengguna
          </h1>
          <p className="text-gray-600 mt-1">Kelola akses pengguna sistem</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              email: "",
              password: "",
              name: "",
              role: "VIEWER",
              opdId: "",
            });
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + Tambah User
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-600">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            <p className="mt-2">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>OPD</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.name}</td>
                    <td className="text-sm">{user.email}</td>
                    <td>
                      <span className={getRoleBadge(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-sm">{user.opd?.name || "-"}</td>
                    <td>
                      <select
                        value={user.isActive ? "active" : "inactive"}
                        onChange={(e) =>
                          handleUpdateStatus(
                            user.id,
                            user.isActive,
                            e.target.value,
                          )
                        }
                        className={`text-sm font-medium px-3 py-1 rounded-md border-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          user.isActive
                            ? "bg-green-50 text-green-700 border-green-300"
                            : "bg-red-50 text-red-700 border-red-300"
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingUser ? "Edit User" : "Tambah User Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {editingUser ? "(kosongkan jika tidak diubah)" : "*"}
                </label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  required
                >
                  <option value="ADMIN">Admin</option>
                  <option value="OPD">OPD</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OPD
                </label>
                <select
                  className="input"
                  value={formData.opdId}
                  onChange={(e) =>
                    setFormData({ ...formData, opdId: e.target.value })
                  }
                >
                  <option value="">Pilih OPD</option>
                  {opds.map((opd) => (
                    <option key={opd.id} value={opd.id}>
                      {opd.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
