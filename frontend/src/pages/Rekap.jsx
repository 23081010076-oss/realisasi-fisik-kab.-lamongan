import { useState, useEffect, useRef } from "react";
import { dashboardService } from "../services";

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const fmt = (n) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2 }).format(n || 0);

export default function Rekap() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulan, setBulan] = useState(new Date().getMonth()); // 0-based index
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  const years = Array.from(
    { length: new Date().getFullYear() - 2010 + 1 },
    (_, i) => new Date().getFullYear() - i,
  );

  useEffect(() => {
    load();
  }, [tahun]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getRekap(tahun);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Rekap Fisik OPD - TA ${tahun}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11px; }
            body { padding: 20px; }
            h2 { text-align: center; font-size: 13px; margin-bottom: 4px; }
            p.sub { text-align: center; font-size: 11px; margin-bottom: 14px; color: #444; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #333; padding: 5px 8px; }
            th { background: #e8eef4; text-align: center; font-weight: bold; }
            td.num { text-align: right; }
            td.center { text-align: center; }
            tr.total td { font-weight: bold; background: #f0f0f0; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const rows = data?.rows || [];
  const totals = data?.totals;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 bg-gray-100 border border-gray-300 rounded px-4 py-2.5">
        <svg
          className="w-4 h-4 text-gray-600 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        <span className="text-sm font-semibold text-gray-700 flex-1 min-w-0">
          Rekap Kegiatan Laporan Fisik OPD Kabupaten Lamongan
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-gray-600">
            Tahun Anggaran
          </label>
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <label className="text-xs font-semibold text-gray-600 ml-1">
            Bulan
          </label>
          <select
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
          >
            {BULAN.map((b, i) => (
              <option key={i} value={i}>
                {b}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-white border border-gray-400 hover:bg-gray-50 text-sm font-semibold rounded shadow-sm ml-1"
          >
            CETAK
          </button>
        </div>
      </div>

      {/* Print area */}
      <div ref={printRef}>
        <h2 className="text-center text-sm font-bold mb-0.5 hidden">
          REKAP KEGIATAN LAPORAN FISIK OPD KABUPATEN LAMONGAN
        </h2>
        <p className="text-center text-xs text-gray-500 hidden">
          Tahun Anggaran {tahun} &mdash; Bulan {BULAN[bulan]}
        </p>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Memuat data...
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Tidak ada data untuk tahun {tahun}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse text-sm"
              style={{ borderColor: "#ccc" }}
            >
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    className="border border-gray-400 bg-blue-50 px-3 py-2 text-center text-xs font-bold w-10"
                  >
                    NO
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-gray-400 bg-blue-50 px-3 py-2 text-center text-xs font-bold"
                  >
                    OPD
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-gray-400 bg-blue-50 px-3 py-2 text-center text-xs font-bold"
                  >
                    JUMLAH KEGIATAN
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-gray-400 bg-blue-50 px-3 py-2 text-center text-xs font-bold"
                  >
                    PAGU ANGGARAN
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-gray-400 bg-blue-50 px-3 py-2 text-center text-xs font-bold"
                  >
                    NILAI KONTRAK
                  </th>
                  <th
                    colSpan={2}
                    className="border border-gray-400 bg-blue-50 px-3 py-2 text-center text-xs font-bold"
                  >
                    REALISASI
                  </th>
                </tr>
                <tr>
                  <th className="border border-gray-400 bg-blue-50 px-3 py-2 text-center text-xs font-bold w-24">
                    FISIK (%)
                  </th>
                  <th className="border border-gray-400 bg-blue-50 px-3 py-2 text-center text-xs font-bold w-28">
                    KEUANGAN (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30">
                    <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs font-medium text-blue-700">
                      {row.opd?.name || row.opd?.code || "-"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-blue-700">
                      {row.jumlahKegiatan}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-xs text-blue-700">
                      {fmt(row.paguAnggaran)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-xs text-blue-700">
                      {fmt(row.nilaiKontrak)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-xs text-blue-700">
                      {row.realisasiFisik.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-xs text-blue-700">
                      {row.pctKeuangan.toFixed(2)}
                    </td>
                  </tr>
                ))}

                {/* Total row */}
                {totals && (
                  <tr className="bg-gray-100 font-bold">
                    <td
                      colSpan={2}
                      className="border border-gray-400 px-3 py-2 text-center text-xs font-bold"
                    >
                      JUMLAH
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-center text-xs">
                      {totals.jumlahKegiatan}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-right text-xs">
                      {fmt(totals.paguAnggaran)}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-right text-xs">
                      {fmt(totals.nilaiKontrak)}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-center text-xs">
                      {totals.realisasiFisik.toFixed(2)}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-center text-xs">
                      {totals.pctKeuangan.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
