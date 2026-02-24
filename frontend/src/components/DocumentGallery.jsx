import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export default function DocumentGallery({
  paketId,
  documents = [],
  onUpload,
  onDelete,
  canEdit = false,
}) {
  const [selectedStage, setSelectedStage] = useState("0");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const stages = [
    { value: "0", label: "0%", sub: "Awal" },
    { value: "50", label: "50%", sub: "Progress" },
    { value: "100", label: "100%", sub: "Selesai" },
  ];

  // Group documents by progress percentage
  const groupedDocs = documents.reduce((acc, doc) => {
    const stage = doc.progressPercentage?.toString() || "other";
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(doc);
    return acc;
  }, {});

  const doUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("progressPercentage", selectedStage);
      formData.append("category", `progress-${selectedStage}`);
      await onUpload(formData);
      const stageName =
        stages.find((s) => s.value === selectedStage)?.sub ?? selectedStage;
      toast.success(`${files.length} foto berhasil diupload`, {
        description: `Tahap ${stageName} · ${files.length} file`,
        duration: 4000,
      });
    } catch (err) {
      toast.error("Gagal upload foto", {
        description:
          err?.response?.data?.error || err?.message || "Terjadi kesalahan",
        duration: 5000,
      });
      throw err;
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => doUpload(Array.from(e.target.files));

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length) doUpload(files);
    },
    [selectedStage, onUpload],
  );

  const handleDelete = async (docId) => {
    setDeletingId(docId);
    try {
      await onDelete(docId);
      toast.success("Foto berhasil dihapus", { duration: 3000 });
    } catch {
      toast.error("Gagal menghapus foto", { duration: 4000 });
    } finally {
      setDeletingId(null);
    }
  };

  const currentStageDocs = groupedDocs[selectedStage] || [];
  const otherDocs = Object.entries(groupedDocs)
    .filter(([k]) => !stages.find((s) => s.value === k))
    .flatMap(([, docs]) => docs);

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9998] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm flex items-center gap-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Tutup
            </button>
            <img
              src={lightbox.src}
              alt={lightbox.name}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-white text-center text-sm mt-2 opacity-70">
              {lightbox.name}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Dokumentasi Foto
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {documents.length} foto tersimpan
            </p>
          </div>
          {canEdit && (
            <label
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all
                ${
                  uploading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                }`}
            >
              {uploading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Mengupload...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Upload Foto
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Stage Tabs */}
        <div className="px-5 pt-4">
          <div className="flex gap-2">
            {stages.map((s) => {
              const count = (groupedDocs[s.value] || []).length;
              const active = selectedStage === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setSelectedStage(s.value)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all border
                    ${
                      active
                        ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  <span className="block text-base font-bold leading-none">
                    {s.label}
                  </span>
                  <span
                    className={`text-xs mt-0.5 block ${active ? "text-primary-100" : "text-gray-400"}`}
                  >
                    {s.sub} · {count} foto
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drop zone + Gallery */}
        <div className="p-5">
          {canEdit && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`mb-4 border-2 border-dashed rounded-xl px-4 py-3 text-center text-sm transition-all
                ${
                  dragOver
                    ? "border-primary-400 bg-primary-50 text-primary-600"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
            >
              <svg
                className="w-5 h-5 mx-auto mb-1 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Seret foto ke sini, atau klik tombol Upload di atas
            </div>
          )}

          {currentStageDocs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentStageDocs.map((doc) => {
                const imgSrc = `http://localhost:4000${doc.filepath}`;
                return (
                  <div
                    key={doc.id}
                    className="group relative aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setLightbox({ src: imgSrc, name: doc.name })}
                  >
                    <img
                      src={imgSrc}
                      alt={doc.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect fill='%23f3f4f6' width='200' height='150'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12'%3ETidak tersedia%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    {/* overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs truncate">
                          {doc.name}
                        </p>
                        <p className="text-gray-300 text-xs">
                          {new Date(doc.createdAt).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                    {/* zoom icon */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/80 rounded-full p-1">
                        <svg
                          className="w-3.5 h-3.5 text-gray-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                    </div>
                    {/* delete */}
                    {canEdit && onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        disabled={deletingId === doc.id}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                        title="Hapus foto"
                      >
                        {deletingId === doc.id ? (
                          <svg
                            className="w-3.5 h-3.5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <svg
                  className="w-7 h-7 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">
                Belum ada foto
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tahap {stages.find((s) => s.value === selectedStage)?.sub} belum
                ada dokumentasinya
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
