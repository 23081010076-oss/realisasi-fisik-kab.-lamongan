import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { paketService, opdService } from "../services";
import { useAuthStore } from "../stores/authStore";
import PaketForm from "./PaketForm";

export default function PaketList() {
  const [pakets, setPakets] = useState([]);
  const [opds, setOpds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    kategori: "",
    status: "",
    tahun: "",
    opdId: "",
  });

  const [totals, setTotals] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const fileInputRef = useRef(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editPaketId, setEditPaketId] = useState(null);
  const { user } = useAuthStore();

  // Lock OPD filter for OPD role on mount
  useEffect(() => {
    if (user?.role === "OPD" && user?.opdId) {
      setFilters((prev) => ({ ...prev, opdId: user.opdId }));
    }
  }, [user]);

  useEffect(() => {
    loadPakets();
  }, [filters]);

  useEffect(() => {
    if (user?.role !== "OPD") {
      opdService
        .getAll({})
        .then((data) => {
          setOpds(Array.isArray(data) ? data : []);
        })
        .catch(() => {});
    }
  }, [user]);

  const loadPakets = async () => {
    try {
      setLoading(true);
      const data = await paketService.getAll(filters);
      setPakets(data.data);
      setPagination(data.pagination);
      setTotals(data.totals || null);
    } catch (error) {
      console.error("Failed to load pakets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin mengubah status paket menjadi ${newStatus}?`,
      )
    ) {
      return;
    }

    try {
      await paketService.updateStatus(id, newStatus);
      loadPakets();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Gagal mengubah status paket");
    }
  };

  const handleExport = async () => {
    try {
      const { kategori, status, tahun } = filters;
      const response = await paketService.exportExcel({
        kategori,
        status,
        tahun,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `paket_${tahun || "semua"}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Gagal mengekspor data");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await paketService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "template_paket.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download template failed:", error);
      alert("Gagal mengunduh template");
    }
  };

  const handleImport = async () => {
    if (!importFile) return alert("Pilih file Excel terlebih dahulu");
    try {
      setImporting(true);
      setImportResult(null);
      const result = await paketService.importExcel(importFile);
      setImportResult(result);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadPakets();
    } catch (error) {
      console.error("Import failed:", error);
      setImportResult({
        message:
          "Import gagal: " + (error.response?.data?.error || error.message),
      });
    } finally {
      setImporting(false);
    }
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: "badge badge-warning",
      ACTIVE: "badge badge-info",
      COMPLETED: "badge badge-success",
      CANCELLED: "badge badge-danger",
    };
    return badges[status] || "badge";
  };

  const getKategoriBadge = (kategori) => {
    const badges = {
      KONSTRUKSI: "badge bg-blue-100 text-blue-800",
      KONSULTANSI: "badge bg-green-100 text-green-800",
      BARANG: "badge bg-yellow-100 text-yellow-800",
      JASA_LAINNYA: "badge bg-red-100 text-red-800",
    };
    return badges[kategori] || "badge";
  };

  return (
    <div>
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Paket Pekerjaan
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Daftar semua paket pekerjaan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="flex-1 text-xs btn btn-secondary sm:text-sm sm:flex-none"
            title="Export ke Excel"
          >
            ⬇ Export
          </button>
          {(user?.role === "ADMIN" || user?.role === "OPD") && (
            <button
              onClick={() => {
                setShowImportModal(true);
                setImportResult(null);
              }}
              className="flex-1 text-xs btn btn-secondary sm:text-sm sm:flex-none"
              title="Import dari Excel"
            >
              ⬆ Import
            </button>
          )}
          {(user?.role === "ADMIN" || user?.role === "OPD") && (
            <button
              onClick={() => {
                setEditPaketId(null);
                setShowFormModal(true);
              }}
              className="flex-1 text-xs btn btn-primary sm:text-sm sm:flex-none"
            >
              + Tambah
            </button>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-black bg-opacity-50 sm:items-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg p-5 sm:p-8 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Import Paket dari Excel
            </h2>

            <div className="p-3 mb-4 text-sm text-blue-800 rounded-md bg-blue-50">
              <p className="mb-1 font-medium">Kolom wajib dalam template:</p>
              <p className="text-xs text-blue-700">
                PAKET PEKERJAAN, OPD, KEGIATAN, KATEGORI, TAHUN, PAGU ANGGARAN,
                NILAI KONTRAK, LOKASI
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Kategori: KONSTRUKSI | KONSULTANSI | BARANG | JASA_LAINNYA
              </p>
              <p className="mt-1 text-xs text-blue-500">
                Kode paket dibuat otomatis. Gunakan template dari tombol
                Download.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="w-full mb-4 text-sm btn btn-secondary"
            >
              ⬇ Download Template Excel
            </button>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Pilih File Excel (.xlsx)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                onChange={(e) => setImportFile(e.target.files[0])}
                className="text-sm input"
              />
            </div>

            {importResult && (
              <div
                className={`mb-4 p-3 rounded-md text-sm ${
                  importResult.failed > 0
                    ? "bg-yellow-50 text-yellow-800"
                    : "bg-green-50 text-green-800"
                }`}
              >
                <p className="font-medium">{importResult.message}</p>
                {importResult.errors?.length > 0 && (
                  <ul className="mt-2 space-y-1 overflow-y-auto text-xs max-h-32">
                    {importResult.errors.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={importing || !importFile}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {importing ? "Mengimpor..." : "Import"}
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setImportFile(null);
                }}
                className="flex-1 btn btn-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 card">
        <div
          className={`grid grid-cols-1 gap-4 ${user?.role === "OPD" ? "md:grid-cols-4" : "md:grid-cols-5"}`}
        >
          <input
            type="text"
            placeholder="Cari paket..."
            className="input"
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
          />
          {user?.role !== "OPD" && (
            <select
              className="input"
              value={filters.opdId}
              onChange={(e) =>
                setFilters({ ...filters, opdId: e.target.value, page: 1 })
              }
            >
              <option value="">Semua OPD</option>
              {opds.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} - {o.name}
                </option>
              ))}
            </select>
          )}
          <select
            className="input"
            value={filters.kategori}
            onChange={(e) =>
              setFilters({ ...filters, kategori: e.target.value, page: 1 })
            }
          >
            <option value="">Semua Kategori</option>
            <option value="KONSTRUKSI">Konstruksi</option>
            <option value="KONSULTANSI">Konsultansi</option>
            <option value="BARANG">Barang</option>
            <option value="JASA_LAINNYA">Jasa Lainnya</option>
          </select>
          <select
            className="input"
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: 1 })
            }
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            className="input"
            value={filters.tahun}
            onChange={(e) =>
              setFilters({ ...filters, tahun: e.target.value, page: 1 })
            }
          >
            <option value="">Semua Tahun</option>
            {Array.from(
              { length: new Date().getFullYear() - 2010 + 1 },
              (_, i) => new Date().getFullYear() - i,
            ).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="py-8 text-center text-gray-600">
            <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin border-primary-600 border-t-transparent"></div>
            <p className="mt-2">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* ── MOBILE CARD VIEW ── */}
            <div className="block space-y-3 md:hidden">
              {pakets.length === 0 ? (
                <p className="py-8 text-sm text-center text-gray-500">
                  Tidak ada data
                </p>
              ) : (
                pakets.map((paket, idx) => {
                  const pagu = paket.pagu || 0;
                  const nilaiKontrak = paket.nilai || 0;
                  const sisa = pagu - nilaiKontrak;
                  const fmtDate = (d) =>
                    d
                      ? new Date(d).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "-";
                  const statusColor = {
                    PENDING: "bg-yellow-100 text-yellow-800",
                    ACTIVE: "bg-blue-100 text-blue-800",
                    COMPLETED: "bg-green-100 text-green-800",
                    CANCELLED: "bg-red-100 text-red-800",
                  };
                  return (
                    <div
                      key={paket.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-snug text-gray-900">
                            {paket.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {paket.kegiatan}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[paket.status] || "bg-gray-100 text-gray-700"}`}
                        >
                          {paket.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 mb-2 text-xs text-gray-600 gap-x-3 gap-y-1">
                        <div>
                          <span className="text-gray-400">Pagu:</span>{" "}
                          <span className="font-medium">
                            {formatRupiah(pagu)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Kontrak:</span>{" "}
                          <span className="font-medium">
                            {formatRupiah(nilaiKontrak)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Mulai:</span>{" "}
                          {fmtDate(paket.tanggalMulai)}
                        </div>
                        <div>
                          <span className="text-gray-400">Selesai:</span>{" "}
                          {fmtDate(paket.tanggalSelesai)}
                        </div>
                        <div>
                          <span className="text-gray-400">OPD:</span>{" "}
                          <span className="truncate">
                            {paket.opd?.name || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Pelaksana:</span>{" "}
                          <span className="truncate">
                            {paket.pelaksana || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(paket.progres, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-700 shrink-0">
                          {paket.progres}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        {user?.role === "ADMIN" || user?.role === "OPD" ? (
                          <select
                            className="w-32 px-2 py-1 text-xs font-medium input"
                            value={paket.status}
                            onChange={(e) =>
                              handleUpdateStatus(paket.id, e.target.value)
                            }
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        ) : (
                          <span />
                        )}
                        <Link
                          to={`/paket/${paket.id}`}
                          className="text-xs font-medium text-primary-600 hover:underline"
                        >
                          Detail →
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── DESKTOP TABLE VIEW ── */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300"
                    >
                      NO
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300 min-w-[120px]"
                    >
                      OPD
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300"
                    >
                      PAKET PEKERJAAN
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300"
                    >
                      PAGU ANGGARAN
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300"
                    >
                      NILAI KONTRAK
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300"
                    >
                      SISA ANGGARAN
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300"
                    >
                      PELAKSANA
                    </th>
                    <th
                      colSpan={2}
                      className="text-center border border-gray-300"
                    >
                      S P M K
                    </th>
                    <th
                      colSpan={2}
                      className="text-center border border-gray-300"
                    >
                      PROGRES REALISASI
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300"
                    >
                      SUMBER DANA
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300"
                    >
                      LOKASI
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300"
                    >
                      KET
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300 min-w-[120px]"
                    >
                      STATUS
                    </th>
                    <th
                      rowSpan={2}
                      className="text-center align-middle border border-gray-300"
                    >
                      AKSI
                    </th>
                  </tr>
                  <tr>
                    <th className="text-center border border-gray-300">
                      MULAI
                    </th>
                    <th className="text-center border border-gray-300">
                      SELESAI
                    </th>
                    <th className="text-center border border-gray-300">
                      FISIK(%)
                    </th>
                    <th className="text-center border border-gray-300">
                      KEUANGAN(%)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pakets.map((paket, idx) => {
                    const pagu = paket.pagu || 0;
                    const nilaiKontrak = paket.nilai || 0;
                    const sisa = pagu - nilaiKontrak;
                    const progresKeuangan =
                      nilaiKontrak > 0
                        ? ((paket.nilaiRealisasi / nilaiKontrak) * 100).toFixed(
                            1,
                          )
                        : "0.0";
                    const fmtDate = (d) =>
                      d
                        ? new Date(d).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "-";
                    return (
                      <tr key={paket.id} className="hover:bg-gray-50">
                        <td className="text-center border border-gray-100">
                          {(filters.page - 1) * filters.limit + idx + 1}
                        </td>
                        <td className="border border-gray-100 whitespace-nowrap">
                          <p className="text-xs font-bold text-blue-700">
                            {paket.opd?.code || "—"}
                          </p>
                          <p
                            className="text-gray-400 text-[10px] leading-tight mt-0.5 max-w-[110px] truncate"
                            title={paket.opd?.name}
                          >
                            {paket.opd?.name || "—"}
                          </p>
                        </td>
                        <td className="border border-gray-100">
                          <p className="font-medium text-gray-900">
                            {paket.name}
                          </p>
                          <p className="text-gray-400">{paket.kegiatan}</p>
                          {paket.kodeRekening && (
                            <p className="text-gray-400">
                              {paket.kodeRekening}
                            </p>
                          )}
                        </td>
                        <td className="text-right border border-gray-100 whitespace-nowrap">
                          {formatRupiah(pagu)}
                        </td>
                        <td className="text-right border border-gray-100 whitespace-nowrap">
                          {formatRupiah(nilaiKontrak)}
                        </td>
                        <td className="text-right border border-gray-100 whitespace-nowrap">
                          {formatRupiah(sisa)}
                        </td>
                        <td className="border border-gray-100">
                          {paket.pelaksana || "-"}
                        </td>
                        <td className="text-center border border-gray-100 whitespace-nowrap">
                          {fmtDate(paket.tanggalMulai)}
                        </td>
                        <td className="text-center border border-gray-100 whitespace-nowrap">
                          {fmtDate(paket.tanggalSelesai)}
                        </td>
                        <td className="text-center border border-gray-100">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-primary-600 h-1.5 rounded-full"
                                style={{ width: `${paket.progres}%` }}
                              ></div>
                            </div>
                            <span className="font-medium">
                              {paket.progres}%
                            </span>
                          </div>
                        </td>
                        <td className="text-center border border-gray-100">
                          {progresKeuangan}%
                        </td>
                        <td className="text-center border border-gray-100">
                          {paket.sumberDana || "-"}
                        </td>
                        <td className="border border-gray-100">
                          {paket.lokasi || "-"}
                        </td>
                        <td className="border border-gray-100">
                          {paket.keterangan || "-"}
                        </td>
                        <td className="border border-gray-100 whitespace-nowrap">
                          {user?.role === "ADMIN" || user?.role === "OPD" ? (
                            <select
                              className="input py-1 px-2 text-xs font-medium w-full min-w-[110px]"
                              value={paket.status}
                              onChange={(e) =>
                                handleUpdateStatus(paket.id, e.target.value)
                              }
                              style={{
                                backgroundColor:
                                  paket.status === "PENDING"
                                    ? "#fef3c7"
                                    : paket.status === "ACTIVE"
                                      ? "#dbeafe"
                                      : paket.status === "COMPLETED"
                                        ? "#d1fae5"
                                        : "#fee2e2",
                                color:
                                  paket.status === "PENDING"
                                    ? "#92400e"
                                    : paket.status === "ACTIVE"
                                      ? "#1e40af"
                                      : paket.status === "COMPLETED"
                                        ? "#065f46"
                                        : "#991b1b",
                                fontWeight: "600",
                                border: "1px solid",
                                borderColor:
                                  paket.status === "PENDING"
                                    ? "#fbbf24"
                                    : paket.status === "ACTIVE"
                                      ? "#3b82f6"
                                      : paket.status === "COMPLETED"
                                        ? "#10b981"
                                        : "#ef4444",
                              }}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          ) : (
                            <span className={getStatusBadge(paket.status)}>
                              {paket.status}
                            </span>
                          )}
                        </td>
                        <td className="text-center border border-gray-100">
                          <Link
                            to={`/paket/${paket.id}`}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline whitespace-nowrap"
                          >
                            Detail →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {pakets.length > 0 &&
                  totals &&
                  (() => {
                    const {
                      pagu: totalPagu,
                      nilai: totalNilai,
                      sisa: totalSisa,
                      avgFisik,
                      avgKeuangan,
                      count,
                    } = totals;
                    return (
                      <tfoot>
                        <tr className="text-xs font-semibold border-t-2 border-blue-300 bg-blue-50">
                          <td
                            colSpan={3}
                            className="px-3 py-2.5 border border-blue-200 text-blue-800 font-bold"
                          >
                            <div className="flex items-center gap-1">
                              <span>TOTAL &amp; RATA-RATA</span>
                            </div>
                            <p className="text-[10px] font-normal text-blue-400 mt-0.5">
                              semua data ({count} paket)
                            </p>
                          </td>
                          <td className="text-right px-3 py-2.5 border border-blue-200 text-blue-900 whitespace-nowrap font-bold">
                            {formatRupiah(totalPagu)}
                          </td>
                          <td className="text-right px-3 py-2.5 border border-blue-200 text-blue-900 whitespace-nowrap font-bold">
                            {formatRupiah(totalNilai)}
                          </td>
                          <td
                            className={`text-right px-3 py-2.5 border border-blue-200 whitespace-nowrap font-bold ${totalSisa < 0 ? "text-red-600" : "text-emerald-700"}`}
                          >
                            {formatRupiah(totalSisa)}
                          </td>
                          <td className="px-3 py-2.5 border border-blue-200 text-gray-400 text-center">
                            —
                          </td>
                          <td className="px-3 py-2.5 border border-blue-200 text-gray-400 text-center">
                            —
                          </td>
                          <td className="px-3 py-2.5 border border-blue-200 text-gray-400 text-center">
                            —
                          </td>
                          <td className="text-center px-3 py-2.5 border border-blue-200">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="w-16 bg-blue-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{
                                    width: `${Math.min(Number(avgFisik), 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="font-bold text-blue-800">
                                {avgFisik?.toFixed
                                  ? avgFisik.toFixed(1)
                                  : avgFisik}
                                %
                              </span>
                              <span className="text-[10px] text-blue-400 font-normal">
                                rata-rata
                              </span>
                            </div>
                          </td>
                          <td className="text-center px-3 py-2.5 border border-blue-200 text-blue-800 font-bold">
                            {avgKeuangan?.toFixed
                              ? avgKeuangan.toFixed(1)
                              : avgKeuangan}
                            %
                            <p className="text-[10px] font-normal text-blue-400">
                              rata-rata
                            </p>
                          </td>
                          <td className="px-3 py-2.5 border border-blue-200 text-gray-400 text-center">
                            —
                          </td>
                          <td className="px-3 py-2.5 border border-blue-200 text-gray-400 text-center">
                            —
                          </td>
                          <td className="px-3 py-2.5 border border-blue-200 text-gray-400 text-center">
                            —
                          </td>
                          <td className="px-3 py-2.5 border border-blue-200 text-gray-400 text-center">
                            —
                          </td>
                          <td className="px-3 py-2.5 border border-blue-200 text-gray-400 text-center">
                            —
                          </td>
                        </tr>
                      </tfoot>
                    );
                  })()}
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-center text-gray-600 sm:text-sm sm:text-left">
                Menampilkan{" "}
                {pagination.total === 0
                  ? 0
                  : (pagination.page - 1) * pagination.limit + 1}{" "}
                -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                dari {pagination.total} data
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1">
                {/* Previous */}
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                  disabled={filters.page === 1}
                  className="px-3 py-1.5 rounded border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  ←
                </button>

                {/* Page Numbers */}
                {(() => {
                  const total = pagination.totalPages || 1;
                  const cur = filters.page;
                  const pages = [];

                  // Always show first page
                  if (cur > 3) {
                    pages.push(1);
                    if (cur > 4) pages.push("...");
                  }

                  // Window around current
                  for (
                    let p = Math.max(1, cur - 2);
                    p <= Math.min(total, cur + 2);
                    p++
                  ) {
                    pages.push(p);
                  }

                  // Always show last page
                  if (cur < total - 2) {
                    if (cur < total - 3) pages.push("...");
                    pages.push(total);
                  }

                  return pages.map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-2 py-1.5 text-sm text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setFilters({ ...filters, page: p })}
                        className={`px-3 py-1.5 rounded border text-sm font-medium transition-colors ${
                          p === cur
                            ? "bg-primary-600 text-white border-primary-600"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  );
                })()}

                {/* Next */}
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                  disabled={filters.page >= (pagination.totalPages || 1)}
                  className="px-3 py-1.5 rounded border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Form Tambah/Edit Paket */}
      <PaketForm
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        paketId={editPaketId}
        onSuccess={() => {
          setShowFormModal(false);
          loadPakets();
        }}
      />
    </div>
  );
}
