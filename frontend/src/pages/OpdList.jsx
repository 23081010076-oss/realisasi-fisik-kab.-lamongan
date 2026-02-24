import { useState, useEffect } from "react";
import { opdService } from "../services";
import { useAuthStore } from "../stores/authStore";

export default function OpdList() {
  const [opds, setOpds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOpd, setEditingOpd] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    kepala: "",
    contact: "",
    address: "",
  });
  const { user } = useAuthStore();

  useEffect(() => {
    loadOpds();
  }, []);

  const loadOpds = async () => {
    try {
      setLoading(true);
      const data = await opdService.getAll();
      setOpds(data);
    } catch (error) {
      console.error("Failed to load OPDs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOpd) {
        await opdService.update(editingOpd.id, formData);
      } else {
        await opdService.create(formData);
      }
      setShowModal(false);
      setEditingOpd(null);
      setFormData({ code: "", name: "", kepala: "", contact: "", address: "" });
      loadOpds();
    } catch (error) {
      console.error("Failed to save OPD:", error);
      alert("Gagal menyimpan data");
    }
  };

  const handleEdit = (opd) => {
    setEditingOpd(opd);
    setFormData({
      code: opd.code,
      name: opd.name,
      kepala: opd.kepala || "",
      contact: opd.contact || "",
      address: opd.address || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus OPD ini?")) return;

    try {
      await opdService.delete(id);
      loadOpds();
    } catch (error) {
      console.error("Failed to delete OPD:", error);
      alert("Gagal menghapus OPD");
    }
  };

  const handleUpdateStatus = async (id, currentStatus, newStatus) => {
    if (currentStatus === (newStatus === "active")) return;

    const action = newStatus === "active" ? "mengaktifkan" : "menonaktifkan";
    if (!window.confirm(`Apakah Anda yakin ingin ${action} OPD ini?`)) {
      loadOpds();
      return;
    }

    try {
      await opdService.toggleStatus(id);
      loadOpds();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Gagal mengubah status OPD");
      loadOpds();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Organisasi Perangkat Daerah
          </h1>
          <p className="text-gray-600 mt-1">Daftar OPD Kabupaten Lamongan</p>
        </div>
        {user?.role === "ADMIN" && (
          <button
            onClick={() => {
              setEditingOpd(null);
              setFormData({
                code: "",
                name: "",
                kepala: "",
                contact: "",
                address: "",
              });
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            + Tambah OPD
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-600">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            <p className="mt-2">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* ── RINGKASAN STATISTIK ── */}
            {opds.length > 0 &&
              (() => {
                const totalOPD = opds.length;
                const aktifOPD = opds.filter((o) => o.isActive).length;
                const totalPaket = opds.reduce(
                  (s, o) => s + (o._count?.pakets || 0),
                  0,
                );
                const totalUser = opds.reduce(
                  (s, o) => s + (o._count?.users || 0),
                  0,
                );
                const avgPaket =
                  totalOPD > 0 ? (totalPaket / totalOPD).toFixed(1) : 0;
                const avgUser =
                  totalOPD > 0 ? (totalUser / totalOPD).toFixed(1) : 0;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    {[
                      {
                        label: "Total OPD",
                        value: totalOPD,
                        sub: "terdaftar",
                        color: "text-blue-700",
                        bg: "bg-blue-100",
                      },
                      {
                        label: "OPD Aktif",
                        value: aktifOPD,
                        sub: `dari ${totalOPD} OPD`,
                        color: "text-emerald-700",
                        bg: "bg-emerald-100",
                      },
                      {
                        label: "OPD Nonaktif",
                        value: totalOPD - aktifOPD,
                        sub: "dinonaktifkan",
                        color: "text-gray-600",
                        bg: "bg-gray-100",
                      },
                      {
                        label: "Total Paket",
                        value: totalPaket,
                        sub: "seluruh OPD",
                        color: "text-orange-700",
                        bg: "bg-orange-100",
                      },
                      {
                        label: "Rata-rata Paket",
                        value: avgPaket,
                        sub: "per OPD",
                        color: "text-purple-700",
                        bg: "bg-purple-100",
                      },
                      {
                        label: "Total Pengguna",
                        value: totalUser,
                        sub: `rata-rata ${avgUser}/OPD`,
                        color: "text-cyan-700",
                        bg: "bg-cyan-100",
                      },
                    ].map(({ label, value, sub, color, bg }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center bg-white rounded-xl p-3 shadow-sm border border-white/80 text-center"
                      >
                        <div
                          className={`h-8 w-8 ${bg} rounded-full flex items-center justify-center mb-1`}
                        >
                          <span className={`text-sm font-black ${color}`}>
                            {value}
                          </span>
                        </div>
                        <p className={`text-xs font-bold ${color}`}>{label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {sub}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opds.map((opd) => (
                <div
                  key={opd.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded">
                        {opd.code}
                      </span>
                      {user?.role === "ADMIN" ? (
                        <select
                          value={opd.isActive ? "active" : "inactive"}
                          onChange={(e) =>
                            handleUpdateStatus(
                              opd.id,
                              opd.isActive,
                              e.target.value,
                            )
                          }
                          className={`text-xs font-medium px-2 py-1 rounded border-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            opd.isActive
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-gray-100 text-gray-600 border-gray-300"
                          }`}
                        >
                          <option value="active">Aktif</option>
                          <option value="inactive">Nonaktif</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                            opd.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {opd.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      )}
                    </div>
                    {user?.role === "ADMIN" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(opd)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(opd.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {opd.name}
                  </h3>
                  {opd.kepala && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong className="text-gray-700">Kepala:</strong>{" "}
                      {opd.kepala}
                    </p>
                  )}
                  {opd.contact && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong className="text-gray-700">Kontak:</strong>{" "}
                      {opd.contact}
                    </p>
                  )}
                  {opd.address && (
                    <p className="text-sm text-gray-600 mb-3">{opd.address}</p>
                  )}
                  <div className="flex justify-between text-sm text-gray-600 pt-3 border-t font-medium">
                    <span>{opd._count?.pakets || 0} Paket</span>
                    <span>{opd._count?.users || 0} Users</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── TABEL RINGKASAN + TOTAL ── */}
            {opds.length > 0 && (
              <div className="mt-6 overflow-x-auto rounded-xl border border-blue-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="px-3 py-2.5 text-left font-semibold">
                        No
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold">
                        Kode
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold">
                        Nama OPD
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold">
                        Status
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold">
                        Jml Paket
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold">
                        Jml Pengguna
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {opds.map((opd, idx) => (
                      <tr
                        key={opd.id}
                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50/40 transition-colors`}
                      >
                        <td className="px-3 py-2 text-gray-400 text-center">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 font-bold text-blue-700">
                          {opd.code}
                        </td>
                        <td className="px-3 py-2 text-gray-800 font-medium">
                          {opd.name}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${opd.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            {opd.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-900">
                          {opd._count?.pakets || 0}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-900">
                          {opd._count?.users || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 border-t-2 border-blue-300 font-bold text-xs">
                      <td colSpan={4} className="px-3 py-2.5 text-blue-800">
                        <span className="text-blue-500 mr-1">Σ</span>TOTAL (
                        {opds.length} OPD)
                      </td>
                      <td className="px-3 py-2.5 text-center text-blue-900 font-black">
                        {opds.reduce((s, o) => s + (o._count?.pakets || 0), 0)}
                        <p className="text-[10px] text-blue-400 font-normal">
                          total paket
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-center text-blue-900 font-black">
                        {opds.reduce((s, o) => s + (o._count?.users || 0), 0)}
                        <p className="text-[10px] text-blue-400 font-normal">
                          total pengguna
                        </p>
                      </td>
                    </tr>
                    <tr className="bg-indigo-50 font-semibold text-xs border-t border-indigo-100">
                      <td colSpan={4} className="px-3 py-2 text-indigo-700">
                        ∅ Rata-rata per OPD
                      </td>
                      <td className="px-3 py-2 text-center text-indigo-800">
                        {opds.length > 0
                          ? (
                              opds.reduce(
                                (s, o) => s + (o._count?.pakets || 0),
                                0,
                              ) / opds.length
                            ).toFixed(1)
                          : 0}
                        <p className="text-[10px] text-indigo-400 font-normal">
                          paket/OPD
                        </p>
                      </td>
                      <td className="px-3 py-2 text-center text-indigo-800">
                        {opds.length > 0
                          ? (
                              opds.reduce(
                                (s, o) => s + (o._count?.users || 0),
                                0,
                              ) / opds.length
                            ).toFixed(1)
                          : 0}
                        <p className="text-[10px] text-indigo-400 font-normal">
                          pengguna/OPD
                        </p>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingOpd ? "Edit OPD" : "Tambah OPD Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode OPD *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kontak
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama OPD *
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
                  Kepala OPD
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.kepala}
                  onChange={(e) =>
                    setFormData({ ...formData, kepala: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOpd(null);
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
