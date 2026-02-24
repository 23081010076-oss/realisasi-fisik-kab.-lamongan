import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { paketService } from "../services";
import { useAuthStore } from "../stores/authStore";
import { generatePaketPDF } from "../utils/pdfGenerator";
import DocumentGallery from "../components/DocumentGallery";
import PaketForm from "./PaketForm";

export default function PaketDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [paket, setPaket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [progressForm, setProgressForm] = useState({
    progres: "",
    nilaiRealisasi: "",
    keterangan: "",
  });

  useEffect(() => {
    loadPaket();
  }, [id]);

  const loadPaket = async () => {
    try {
      setLoading(true);
      const data = await paketService.getById(id);
      setPaket(data);
    } catch (error) {
      console.error("Failed to load paket:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    try {
      await paketService.updateProgress(id, progressForm);
      setShowProgressModal(false);
      loadPaket();
      setProgressForm({ progres: "", nilaiRealisasi: "", keterangan: "" });
    } catch (error) {
      console.error("Failed to update progress:", error);
      alert("Gagal update progress");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus paket ini?")) return;

    try {
      await paketService.delete(id);
      alert("Paket berhasil dihapus");
      navigate("/paket");
    } catch (error) {
      console.error("Failed to delete paket:", error);
      alert("Gagal menghapus paket");
    }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      await generatePaketPDF(paket);
      alert("PDF berhasil diunduh!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Gagal generate PDF: " + error.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDocumentUpload = async (formData) => {
    try {
      await paketService.uploadDocuments(id, formData);
      await loadPaket();
    } catch (error) {
      console.error("Failed to upload document:", error);
      throw error;
    }
  };

  const handleDocumentDelete = async (documentId) => {
    try {
      await paketService.deleteDocument(id, documentId);
      await loadPaket();
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
    }
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!paket) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Paket tidak ditemukan</p>
      </div>
    );
  }

  const canEdit =
    user?.role === "ADMIN" ||
    (user?.role === "OPD" && user?.opdId === paket.opdId);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link
            to="/paket"
            className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block hover:underline"
          >
            ← Kembali
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{paket.name}</h1>
          <p className="text-gray-600 mt-1">{paket.code}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                clipRule="evenodd"
              />
            </svg>
            <span>{pdfLoading ? "Generating PDF..." : "Export PDF"}</span>
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => setShowProgressModal(true)}
                className="btn btn-primary"
              >
                Update Progress
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="btn btn-secondary"
              >
                Edit
              </button>
              {user?.role === "ADMIN" && (
                <button onClick={handleDelete} className="btn btn-danger">
                  Hapus
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Informasi Paket
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-600 mb-1">Kode Paket</dt>
                <dd className="font-medium text-gray-900">{paket.code}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 mb-1">Tahun</dt>
                <dd className="font-medium text-gray-900">{paket.tahun}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 mb-1">Kategori</dt>
                <dd className="font-medium text-gray-900">
                  {paket.kategori?.replace("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 mb-1">Status</dt>
                <dd className="font-medium text-gray-900">{paket.status}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-gray-600 mb-1">Kegiatan</dt>
                <dd className="font-medium text-gray-900">{paket.kegiatan}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-gray-600 mb-1">Lokasi</dt>
                <dd className="font-medium text-gray-900">{paket.lokasi}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Tanggal Mulai</dt>
                <dd className="font-medium">
                  {formatDate(paket.tanggalMulai)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Tanggal Selesai</dt>
                <dd className="font-medium">
                  {formatDate(paket.tanggalSelesai)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-gray-600">OPD</dt>
                <dd className="font-medium">{paket.opd?.name}</dd>
              </div>
              {paket.keterangan && (
                <div className="col-span-2">
                  <dt className="text-sm text-gray-600">Keterangan</dt>
                  <dd className="font-medium">{paket.keterangan}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Dokumentasi Foto */}
          <DocumentGallery
            paketId={id}
            documents={paket.documents || []}
            onUpload={handleDocumentUpload}
            onDelete={handleDocumentDelete}
            canEdit={canEdit}
          />

          {/* Progress History */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Riwayat Progress
            </h2>
            <div className="space-y-4">
              {paket.progress?.map((prog) => (
                <div
                  key={prog.id}
                  className="border-l-4 border-primary-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        Progress: {prog.progres}%
                      </p>
                      <p className="text-sm text-gray-600">
                        Realisasi: {formatRupiah(prog.nilaiRealisasi)}
                      </p>
                      {prog.keterangan && (
                        <p className="text-sm text-gray-600 mt-1">
                          {prog.keterangan}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(prog.tanggal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Nilai Paket</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Pagu</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatRupiah(paket.nilai)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Realisasi</p>
                <p className="text-xl font-bold text-green-600">
                  {formatRupiah(paket.nilaiRealisasi)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sisa</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatRupiah(paket.nilai - paket.nilaiRealisasi)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Progres Pekerjaan</h3>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - paket.progres / 100)}`}
                    className="text-primary-600"
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-gray-900">
                  {paket.progres}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Update Progress
            </h2>
            <form onSubmit={handleUpdateProgress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={progressForm.progres}
                  onChange={(e) =>
                    setProgressForm({
                      ...progressForm,
                      progres: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nilai Realisasi
                </label>
                <input
                  type="number"
                  className="input"
                  value={progressForm.nilaiRealisasi}
                  onChange={(e) =>
                    setProgressForm({
                      ...progressForm,
                      nilaiRealisasi: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan
                </label>
                <textarea
                  className="input"
                  rows="3"
                  value={progressForm.keterangan}
                  onChange={(e) =>
                    setProgressForm({
                      ...progressForm,
                      keterangan: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
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
      {/* Edit Modal */}
      <PaketForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        paketId={id}
        onSuccess={() => {
          setShowEditModal(false);
          loadPaket();
        }}
      />
    </div>
  );
}
