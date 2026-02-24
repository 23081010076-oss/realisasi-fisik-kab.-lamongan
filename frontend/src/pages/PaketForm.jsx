import { useState, useEffect } from "react";
import { paketService, opdService } from "../services";
import { useAuthStore } from "../stores/authStore";

const F = ({ label, required: req, children }) => (
  <div>
    <label className="block mb-1 text-sm font-medium text-gray-700">
      {label} {req && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

// Format angka ke string dengan titik ribuan (id-ID)
const fmtMoney = (val) => {
  const n = String(val).replace(/\D/g, "");
  if (!n) return "";
  return Number(n).toLocaleString("id-ID");
};

// Input Rupiah — tampil dengan titik, simpan angka murni
const MoneyInput = ({
  value,
  onChange,
  placeholder = "0",
  required,
  className = "input",
}) => {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ""); // strip semua non-digit
    onChange(raw); // simpan angka murni ke state
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      value={fmtMoney(value)}
      placeholder={placeholder}
      onChange={handleChange}
      required={required}
    />
  );
};

const EMPTY_FORM = {
  name: "",
  kategori: "KONSTRUKSI",
  opdId: "",
  kegiatan: "",
  lokasi: "",
  pagu: "",
  nilai: "",
  nilaiRealisasi: "",
  progres: "",
  tahun: new Date().getFullYear(),
  tanggalMulai: "",
  tanggalSelesai: "",
  keterangan: "",
  nomorKontrak: "",
  noSPMK: "",
  sumberDana: "APBD",
  pelaksana: "",
  kodeRekening: "",
};

/**
 * PaketForm – modal component.
 * Props:
 *   isOpen    – boolean
 *   onClose   – fn()
 *   paketId   – string|null  (null = tambah baru, ada id = edit)
 *   onSuccess – fn()  dipanggil setelah simpan berhasil
 */
export default function PaketForm({ isOpen, onClose, paketId, onSuccess }) {
  const { user } = useAuthStore();
  const [opds, setOpds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Load OPD list once
  useEffect(() => {
    opdService
      .getAll()
      .then((data) => {
        setOpds(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  // Load or reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (paketId) {
      paketService
        .getById(paketId)
        .then((data) => {
          setFormData({
            code: data.code || "",
            name: data.name || "",
            kategori: data.kategori || "KONSTRUKSI",
            opdId: data.opdId || "",
            kegiatan: data.kegiatan || "",
            lokasi: data.lokasi || "",
            pagu: data.pagu ?? "",
            nilai: data.nilai ?? "",
            nilaiRealisasi: data.nilaiRealisasi ?? "",
            progres: data.progres ?? "",
            tahun: data.tahun || new Date().getFullYear(),
            tanggalMulai: data.tanggalMulai?.split("T")[0] || "",
            tanggalSelesai: data.tanggalSelesai?.split("T")[0] || "",
            keterangan: data.keterangan || "",
            nomorKontrak: data.nomorKontrak || "",
            noSPMK: data.noSPMK || "",
            sumberDana: data.sumberDana || "APBD",
            pelaksana: data.pelaksana || "",
            kodeRekening: data.kodeRekening || "",
          });
        })
        .catch(() => {});
    } else {
      setFormData({
        ...EMPTY_FORM,
        tahun: new Date().getFullYear(),
        opdId: user?.role === "OPD" && user?.opdId ? user.opdId : "",
      });
    }
  }, [isOpen, paketId]);

  const set = (field, val) =>
    setFormData((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (paketId) {
        await paketService.update(paketId, formData);
      } else {
        await paketService.create(formData);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
      alert(
        "Gagal menyimpan data: " +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center bg-black/50 sm:p-4">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {paketId ? "Edit Paket Pekerjaan" : "Tambah Paket Pekerjaan"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {paketId
                ? "Perbarui informasi paket"
                : "Buat paket pekerjaan baru"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-lg leading-none text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <form
          id="paket-form"
          onSubmit={handleSubmit}
          className="flex-1 px-5 py-4 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <F label="Nama Paket" required>
                <input
                  className="input"
                  value={formData.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </F>
            </div>

            <div className="sm:col-span-2">
              <F label="Kegiatan" required>
                <input
                  className="input"
                  value={formData.kegiatan}
                  onChange={(e) => set("kegiatan", e.target.value)}
                  required
                />
              </F>
            </div>

            <F label="Kategori" required>
              <select
                className="input"
                value={formData.kategori}
                onChange={(e) => set("kategori", e.target.value)}
                required
              >
                <option value="KONSTRUKSI">Konstruksi</option>
                <option value="KONSULTANSI">Konsultansi</option>
                <option value="BARANG">Barang</option>
                <option value="JASA_LAINNYA">Jasa Lainnya</option>
              </select>
            </F>

            <F label="OPD" required>
              <select
                className="input"
                value={formData.opdId}
                onChange={(e) => set("opdId", e.target.value)}
                disabled={user?.role === "OPD"}
                required
              >
                <option value="">Pilih OPD</option>
                {opds.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </F>

            <F label="Tahun" required>
              <input
                type="number"
                className="input"
                value={formData.tahun}
                onChange={(e) => set("tahun", e.target.value)}
                required
              />
            </F>

            <F label="Sumber Dana">
              <select
                className="input"
                value={formData.sumberDana}
                onChange={(e) => set("sumberDana", e.target.value)}
              >
                <option value="APBD">APBD</option>
                <option value="APBN">APBN</option>
                <option value="DAK">DAK</option>
                <option value="BLUD">BLUD</option>
                <option value="HIBAH">Hibah</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </F>

            <div className="sm:col-span-2">
              <F label="Lokasi" required>
                <input
                  className="input"
                  value={formData.lokasi}
                  onChange={(e) => set("lokasi", e.target.value)}
                  required
                />
              </F>
            </div>

            <F label="Pagu Anggaran (Rp)">
              <MoneyInput
                value={formData.pagu}
                placeholder="0"
                onChange={(v) => set("pagu", v)}
              />
            </F>

            <F label="Nilai Kontrak (Rp)" required>
              <MoneyInput
                value={formData.nilai}
                placeholder="0"
                onChange={(v) => set("nilai", v)}
                required
              />
            </F>

            <F label="Nilai Realisasi (Rp)">
              <MoneyInput
                value={formData.nilaiRealisasi}
                placeholder="0"
                onChange={(v) => set("nilaiRealisasi", v)}
              />
            </F>

            <F label="Progres Fisik (%)">
              <input
                type="number"
                min="0"
                max="100"
                className="input"
                value={formData.progres}
                placeholder="0"
                onChange={(e) => set("progres", e.target.value)}
              />
            </F>

            <F label="Pelaksana">
              <input
                className="input"
                value={formData.pelaksana}
                placeholder="Nama pelaksana"
                onChange={(e) => set("pelaksana", e.target.value)}
              />
            </F>

            <F label="Kode Rekening">
              <input
                className="input"
                value={formData.kodeRekening}
                placeholder="1.03.03.2.01.0028"
                onChange={(e) => set("kodeRekening", e.target.value)}
              />
            </F>

            <F label="Nomor Kontrak">
              <input
                className="input"
                value={formData.nomorKontrak}
                placeholder="600/001.PKT/2026"
                onChange={(e) => set("nomorKontrak", e.target.value)}
              />
            </F>

            <F label="No SPMK">
              <input
                className="input"
                value={formData.noSPMK}
                placeholder="700/001.SPMK/2026"
                onChange={(e) => set("noSPMK", e.target.value)}
              />
            </F>

            <F label="SPMK Mulai">
              <input
                type="date"
                className="input"
                value={formData.tanggalMulai}
                onChange={(e) => set("tanggalMulai", e.target.value)}
              />
            </F>

            <F label="SPMK Selesai">
              <input
                type="date"
                className="input"
                value={formData.tanggalSelesai}
                onChange={(e) => set("tanggalSelesai", e.target.value)}
              />
            </F>

            <div className="sm:col-span-2">
              <F label="Keterangan">
                <textarea
                  className="input"
                  rows="2"
                  value={formData.keterangan}
                  onChange={(e) => set("keterangan", e.target.value)}
                />
              </F>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn btn-secondary"
          >
            Batal
          </button>
          <button
            form="paket-form"
            type="submit"
            disabled={loading}
            className="flex-1 btn btn-primary disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
