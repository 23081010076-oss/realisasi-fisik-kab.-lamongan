import { useState, useEffect } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { dashboardService } from "../services";
import {
  Building2,
  Briefcase,
  Package,
  Wrench,
  TrendingUp,
  Wallet,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
  CalendarDays,
  Layers,
  Activity,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Target,
  RefreshCw,
  Trophy,
  FileText,
  ChevronRight,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

const formatRupiah = (number) => {
  if (!number) return "Rp 0";
  if (number >= 1_000_000_000) return `Rp ${(number / 1_000_000_000).toFixed(2)} M`;
  if (number >= 1_000_000) return `Rp ${(number / 1_000_000).toFixed(1)} Jt`;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
};

const formatRupiahFull = (number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number || 0);

const formatTanggal = (date) =>
  new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

const hariIni = () =>
  new Date().toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, [tahun]);

  const loadData = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const [statsData, chartDataRes, recentData] = await Promise.all([
        dashboardService.getStats(tahun),
        dashboardService.getChartData(tahun),
        dashboardService.getRecentUpdates(10),
      ]);
      setStats(statsData);
      setChartData(chartDataRes);
      setRecentUpdates(recentData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500 font-medium">Memuat data dashboard</p>
          <p className="text-xs text-gray-400">Tahun Anggaran {tahun}</p>
        </div>
      </div>
    );
  }

  const pct = parseFloat(stats?.nilai?.persentase || 0);
  const totalPaket = stats?.kategori?.total || 0;
  const totalAktif = stats?.status?.active || 0;
  const totalSelesai = stats?.status?.completed || 0;
  const totalPending = stats?.status?.pending || 0;
  const totalBatal = stats?.status?.cancelled || 0;

  // Paket dengan progres rendah (< 30)  dari recent updates sebagai indikasi
  const paketKritis = recentUpdates.filter(p => p.status === "ACTIVE" && p.progres < 30);

  // Top OPD by realisasi
  const topOpd = (chartData?.opd || [])
    .filter(o => o.totalRealisasi > 0)
    .sort((a, b) => (b.totalRealisasi / b.totalNilai) - (a.totalRealisasi / a.totalNilai))
    .slice(0, 3);

  // Chart data
  const lineChartData = {
    labels: monthNames,
    datasets: [
      {
        label: "Jumlah Paket",
        data: monthNames.map((_, idx) => chartData?.monthly?.find(m => m.month === idx + 1)?.count || 0),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.08)",
        pointBackgroundColor: "#2563eb",
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Rata-rata Progres (%)",
        data: monthNames.map((_, idx) => chartData?.monthly?.find(m => m.month === idx + 1)?.avgProgres?.toFixed(1) || 0),
        borderColor: "#059669",
        backgroundColor: "rgba(5,150,105,0.08)",
        pointBackgroundColor: "#059669",
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
      },
    ],
  };

  const doughnutData = {
    labels: ["Konstruksi", "Konsultansi", "Barang", "Jasa Lainnya"],
    datasets: [{
      data: [
        stats?.kategori?.konstruksi || 0,
        stats?.kategori?.konsultansi || 0,
        stats?.kategori?.barang || 0,
        stats?.kategori?.jasaLainnya || 0,
      ],
      backgroundColor: ["#2563eb", "#059669", "#d97706", "#7c3aed"],
      borderWidth: 3,
      borderColor: "#fff",
      hoverOffset: 8,
    }],
  };

  const opdBarData = {
    labels: (chartData?.opd || []).slice(0, 8).map(o => o.opd?.code || o.opd?.name?.slice(0, 10) || ""),
    datasets: [
      {
        label: "Nilai Kontrak",
        data: (chartData?.opd || []).slice(0, 8).map(o => o.totalNilai || 0),
        backgroundColor: "rgba(37,99,235,0.7)",
        borderRadius: 5,
      },
      {
        label: "Realisasi",
        data: (chartData?.opd || []).slice(0, 8).map(o => o.totalRealisasi || 0),
        backgroundColor: "rgba(5,150,105,0.7)",
        borderRadius: 5,
      },
    ],
  };

  const statusBadge = (status) => {
    const map = {
      ACTIVE: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
      COMPLETED: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      PENDING: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      CANCELLED: "bg-red-100 text-red-700 ring-1 ring-red-200",
    };
    const label = { ACTIVE: "Aktif", COMPLETED: "Selesai", PENDING: "Pending", CANCELLED: "Batal" };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`}>
        {label[status] || status}
      </span>
    );
  };

  const progresColor = (p) => {
    if (p >= 80) return "bg-emerald-500";
    if (p >= 50) return "bg-blue-500";
    if (p >= 30) return "bg-amber-500";
    return "bg-red-500";
  };

  const progresTextColor = (p) => {
    if (p >= 80) return "text-emerald-700";
    if (p >= 50) return "text-blue-700";
    if (p >= 30) return "text-amber-700";
    return "text-red-600";
  };

  return (
    <div className="space-y-0">

      {/* 
          MASTHEAD  identitas resmi pemerintah
       */}
      <div className="bg-gradient-to-r from-[#0a2240] via-[#0d3060] to-[#0a2240] text-white px-4 sm:px-6 py-3 rounded-t-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo-lamongan.png" alt="Lamongan" className="h-10 w-10 rounded-full object-cover shrink-0 opacity-90" onError={e => { e.target.style.display='none'; }} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-widest text-blue-300 uppercase">Pemerintah Kabupaten Lamongan</p>
            <p className="text-sm font-bold leading-tight truncate">Sistem Informasi Monitoring Pengadaan</p>
          </div>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[11px] text-blue-300 leading-tight">{hariIni()}</p>
          <p className="text-[11px] text-blue-400 mt-0.5">Data diperbarui otomatis</p>
        </div>
      </div>

      {/* 
          TOOLBAR  judul + filter tahun + refresh
       */}
      <div className="bg-white dark:bg-gray-900 border-x border-b rounded-b-none px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-gray-800 dark:text-white">Dashboard Monitoring</span>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-500">Rekapitulasi TA {tahun}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Perbarui</span>
          </button>
          <div className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
            <CalendarDays className="h-3.5 w-3.5" />
            <select
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="bg-transparent focus:outline-none cursor-pointer font-semibold"
            >
              {Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y} className="text-gray-900 bg-white">{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">

        {/* 
            BARIS UTAMA  3 panel asimetrik
         */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Panel 1  Ringkasan Utama */}
          <div className="lg:col-span-3 rounded-2xl border bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-md flex flex-col justify-between min-h-[200px]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-4 w-4 text-blue-200" />
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Total Paket</span>
              </div>
              <p className="text-5xl font-black mt-1">{totalPaket}</p>
              <p className="text-blue-200 text-sm mt-1">paket kegiatan pengadaan</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-blue-200 text-xs mb-0.5">Sedang Berjalan</p>
                <p className="text-2xl font-bold">{totalAktif}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-blue-200 text-xs mb-0.5">Selesai</p>
                <p className="text-2xl font-bold">{totalSelesai}</p>
              </div>
            </div>
          </div>

          {/* Panel 2  Keuangan */}
          <div className="lg:col-span-5 rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Realisasi Keuangan</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Tahun Anggaran {tahun}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl px-3 py-2 text-center">
                <p className="text-2xl font-black text-blue-600">{pct}%</p>
                <p className="text-[10px] text-blue-400">terserap</p>
              </div>
            </div>

            {/* Progress dengan milestone */}
            <div className="relative mt-2 mb-4">
              <div className="relative h-5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-emerald-500 transition-all duration-1000 relative"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                >
                  <div className="absolute right-0 top-0 h-full w-1 bg-white/40" />
                </div>
              </div>
              {/* milestone marks */}
              <div className="flex justify-between mt-1 px-0.5">
                {[25, 50, 75, 100].map(m => (
                  <div key={m} className="flex flex-col items-center" style={{marginLeft: m === 25 ? '22%' : m === 50 ? '23%' : m === 75 ? '23%' : '0'}}>
                    <span className={`text-[10px] ${pct >= m ? "text-blue-600 font-bold" : "text-gray-400"}`}>{m}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs text-gray-500">Total Kontrak</p>
                </div>
                <p className="font-black text-gray-900 dark:text-white text-sm leading-tight">{formatRupiahFull(stats?.nilai?.total)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <p className="text-xs text-emerald-600">Terealisasi</p>
                </div>
                <p className="font-black text-emerald-700 text-sm leading-tight">{formatRupiahFull(stats?.nilai?.realisasi)}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-[11px] text-blue-500 font-medium">Rata-rata Progres Fisik</p>
                  <p className="text-xs text-blue-400">Dari seluruh paket aktif</p>
                </div>
              </div>
              <p className="text-2xl font-black text-blue-700">{stats?.progres?.average || 0}%</p>
            </div>
          </div>

          {/* Panel 3  Top OPD Performa */}
          <div className="lg:col-span-4 rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 p-1.5">
                <Trophy className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Performa OPD</p>
                <p className="text-xs text-gray-400">Tingkat realisasi tertinggi</p>
              </div>
            </div>

            {topOpd.length > 0 ? (
              <div className="space-y-3">
                {topOpd.map((o, idx) => {
                  const realisasiPct = o.totalNilai > 0 ? Math.round((o.totalRealisasi / o.totalNilai) * 100) : 0;
                  const medals = ["", "", ""];
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-lg shrink-0">{medals[idx]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{o.opd?.code || o.opd?.name?.slice(0, 20) || ""}</p>
                          <span className={`text-xs font-bold ml-2 shrink-0 ${realisasiPct >= 80 ? "text-emerald-600" : realisasiPct >= 50 ? "text-blue-600" : "text-amber-600"}`}>{realisasiPct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div className={`h-full rounded-full ${realisasiPct >= 80 ? "bg-emerald-500" : realisasiPct >= 50 ? "bg-blue-500" : "bg-amber-500"} transition-all duration-700`} style={{ width: `${Math.min(realisasiPct, 100)}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatRupiah(o.totalRealisasi)} / {formatRupiah(o.totalNilai)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-gray-300">
                <Trophy className="h-8 w-8 mb-2" />
                <p className="text-xs">Belum ada data realisasi</p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="text-xs text-gray-400">Total OPD terlibat</p>
              <span className="text-sm font-bold text-gray-800 dark:text-white">{chartData?.opd?.length || 0} OPD</span>
            </div>
          </div>
        </div>

        {/* 
            ALERT  paket dengan progres rendah & status
         */}
        <div className="grid gap-4 lg:grid-cols-12">

          {/* Status Distribution */}
          <div className="lg:col-span-7 rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Distribusi Status Paket</p>
            <p className="text-xs text-gray-400 mb-4">Perbandingan progres seluruh status kegiatan pengadaan TA {tahun}</p>

            {/* Stacked bar horizontal */}
            <div className="mb-4">
              <div className="flex h-8 w-full rounded-xl overflow-hidden">
                {totalPaket > 0 && [
                  { key: "active", label: "Aktif", count: totalAktif, color: "bg-blue-500" },
                  { key: "completed", label: "Selesai", count: totalSelesai, color: "bg-emerald-500" },
                  { key: "pending", label: "Pending", count: totalPending, color: "bg-amber-400" },
                  { key: "cancelled", label: "Batal", count: totalBatal, color: "bg-red-400" },
                ].filter(s => s.count > 0).map((s, i, arr) => (
                  <div
                    key={s.key}
                    className={`${s.color} flex items-center justify-center transition-all duration-700 ${i === 0 ? "rounded-l-xl" : ""} ${i === arr.length - 1 ? "rounded-r-xl" : ""}`}
                    style={{ width: `${(s.count / totalPaket) * 100}%` }}
                    title={`${s.label}: ${s.count} paket (${Math.round((s.count / totalPaket) * 100)}%)`}
                  >
                    {s.count / totalPaket > 0.1 && (
                      <span className="text-white text-xs font-bold">{s.count}</span>
                    )}
                  </div>
                ))}
              </div>
              {/* Legenda */}
              <div className="flex flex-wrap gap-3 mt-3">
                {[
                  { label: "Aktif", count: totalAktif, icon: PlayCircle, color: "text-blue-600", dot: "bg-blue-500" },
                  { label: "Selesai", count: totalSelesai, icon: CheckCircle2, color: "text-emerald-600", dot: "bg-emerald-500" },
                  { label: "Pending", count: totalPending, icon: PauseCircle, color: "text-amber-600", dot: "bg-amber-400" },
                  { label: "Dibatalkan", count: totalBatal, icon: XCircle, color: "text-red-500", dot: "bg-red-400" },
                ].map(({ label, count, icon: Icon, color, dot }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${dot} shrink-0`} />
                    <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
                    <span className={`text-xs font-bold ${color}`}>{count}</span>
                    {totalPaket > 0 && <span className="text-[10px] text-gray-400">({Math.round((count/totalPaket)*100)}%)</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid 4 status detail */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                { label: "Aktif", count: totalAktif, icon: PlayCircle, bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700", sub: "Sedang berjalan" },
                { label: "Selesai", count: totalSelesai, icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-700", sub: "Pekerjaan tuntas" },
                { label: "Pending", count: totalPending, icon: PauseCircle, bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700", sub: "Menunggu proses" },
                { label: "Batal", count: totalBatal, icon: XCircle, bg: "bg-red-50 dark:bg-red-950", text: "text-red-600", sub: "Tidak dilanjutkan" },
              ].map(({ label, count, icon: Icon, bg, text, sub }) => (
                <div key={label} className={`${bg} rounded-xl p-3`}>
                  <Icon className={`h-4 w-4 ${text} mb-2`} />
                  <p className={`text-xl font-black ${text}`}>{count}</p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Alert paket kritis */}
          <div className="lg:col-span-5 rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className={`rounded-lg p-1.5 ${paketKritis.length > 0 ? "bg-red-100 dark:bg-red-900/40" : "bg-emerald-100 dark:bg-emerald-900/40"}`}>
                {paketKritis.length > 0
                  ? <AlertTriangle className="h-4 w-4 text-red-600" />
                  : <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                }
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {paketKritis.length > 0 ? `${paketKritis.length} Paket Perlu Perhatian` : "Semua Paket On-Track"}
                </p>
                <p className="text-xs text-gray-400">Paket aktif dengan progres &lt; 30%</p>
              </div>
            </div>

            {paketKritis.length > 0 ? (
              <div className="space-y-2 flex-1 overflow-y-auto max-h-52">
                {paketKritis.map((p) => (
                  <div key={p.id} className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 p-2.5">
                    <div className="mt-0.5 shrink-0">
                      <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{p.progres}%</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{p.opd?.code}  {p.kategori}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kondisi Baik</p>
                <p className="text-xs text-gray-400 mt-1">Tidak ada paket aktif dengan progres di bawah 30%</p>
              </div>
            )}

            {/* Ringkasan cepat */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-lg font-black text-gray-900 dark:text-white">{totalPaket > 0 ? Math.round((totalSelesai / totalPaket) * 100) : 0}%</p>
                <p className="text-[10px] text-gray-400">Tingkat Penyelesaian</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-gray-900 dark:text-white">{pct}%</p>
                <p className="text-[10px] text-gray-400">Serapan Keuangan</p>
              </div>
            </div>
          </div>
        </div>

        {/* 
            KATEGORI CARDS  4 jenis pengadaan
         */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-bold text-gray-800 dark:text-white">Rekapitulasi Per Jenis Pengadaan</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Pekerjaan Konstruksi", value: stats?.kategori?.konstruksi || 0, icon: Building2, from: "from-blue-600", to: "to-blue-700", ring: "ring-blue-700/40", sub: "Infrastruktur & bangunan" },
              { label: "Jasa Konsultansi", value: stats?.kategori?.konsultansi || 0, icon: Briefcase, from: "from-emerald-600", to: "to-teal-700", ring: "ring-emerald-700/40", sub: "Perencanaan & pengawasan" },
              { label: "Pengadaan Barang", value: stats?.kategori?.barang || 0, icon: Package, from: "from-orange-500", to: "to-amber-600", ring: "ring-orange-600/40", sub: "Alat, bahan & material" },
              { label: "Jasa Lainnya", value: stats?.kategori?.jasaLainnya || 0, icon: Wrench, from: "from-violet-600", to: "to-purple-700", ring: "ring-violet-700/40", sub: "Pemeliharaan & layanan" },
            ].map(({ label, value, icon: Icon, from, to, ring, sub }) => {
              const share = totalPaket ? Math.round((value / totalPaket) * 100) : 0;
              return (
                <div key={label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${from} ${to} p-4 text-white shadow-md ring-2 ${ring} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}>
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                  <div className="pointer-events-none absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-black/10" />
                  <div className="flex items-start justify-between mb-3">
                    <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-white/80 text-xs font-semibold">{share}%</span>
                  </div>
                  <p className="text-4xl font-black">{value}</p>
                  <p className="text-white font-semibold text-sm mt-1 leading-tight">{label}</p>
                  <p className="text-white/60 text-[10px] mt-0.5">{sub}</p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full rounded-full bg-white/60 transition-all duration-700" style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 
            CHARTS
         */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* Line chart */}
          <div className="lg:col-span-4 rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Tren Pengadaan Bulanan</p>
                <p className="text-xs text-gray-400 mt-0.5">Jumlah paket & rata-rata progres per bulan  TA {tahun}</p>
              </div>
              <div className="flex gap-3 text-[10px] text-gray-400">
                <div className="flex items-center gap-1"><div className="h-2 w-4 rounded-sm bg-blue-500" />Paket</div>
                <div className="flex items-center gap-1"><div className="h-2 w-4 rounded-sm bg-emerald-500" />Progres</div>
              </div>
            </div>
            <div className="h-[220px]">
              <Line data={lineChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: "#1e293b", titleFont: { size: 11 }, bodyFont: { size: 11 } },
                },
                scales: {
                  x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10 } } },
                  y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10 } }, title: { display: true, text: "Jumlah Paket", font: { size: 9 } } },
                  y1: { position: "right", grid: { drawOnChartArea: false }, ticks: { font: { size: 10 } }, title: { display: true, text: "Progres (%)", font: { size: 9 } } },
                },
              }} />
            </div>
          </div>

          {/* Doughnut */}
          <div className="lg:col-span-3 rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Komposisi Jenis Pengadaan</p>
              <p className="text-xs text-gray-400 mt-0.5">Proporsi berdasarkan jumlah paket TA {tahun}</p>
            </div>
            <div className="h-[200px] flex items-center justify-center">
              <Doughnut data={doughnutData} options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                  legend: { position: "bottom", labels: { font: { size: 11 }, padding: 12, boxWidth: 12 } },
                  tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} paket (${totalPaket ? Math.round((ctx.raw / totalPaket) * 100) : 0}%)` } },
                },
              }} />
            </div>
          </div>
        </div>

        {/* OPD Bar Chart */}
        {(chartData?.opd?.length || 0) > 0 && (
          <div className="rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Nilai Kontrak vs Realisasi per OPD</p>
                <p className="text-xs text-gray-400 mt-0.5">8 OPD dengan nilai kontrak terbesar  TA {tahun}</p>
              </div>
              <div className="flex gap-3 text-[10px] text-gray-400">
                <div className="flex items-center gap-1"><div className="h-2 w-4 rounded-sm bg-blue-500 opacity-80" />Kontrak</div>
                <div className="flex items-center gap-1"><div className="h-2 w-4 rounded-sm bg-emerald-500 opacity-80" />Realisasi</div>
              </div>
            </div>
            <div className="h-[240px]">
              <Bar data={opdBarData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#1e293b",
                    callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatRupiahFull(ctx.raw)}` },
                  },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                  y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10 }, callback: (v) => formatRupiah(v) } },
                },
              }} />
            </div>
          </div>
        )}

        {/* 
            RECENT UPDATES TABLE
         */}
        <div className="rounded-2xl border bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/40 p-1.5">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Pembaruan Terkini</p>
                <p className="text-xs text-gray-400">10 paket dengan perubahan data terbaru</p>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{recentUpdates.length} data</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-8">#</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">OPD</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Nama Paket / Lokasi</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Jenis</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Nilai</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Progres</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Diperbarui</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentUpdates.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.status === "ACTIVE" && item.progres < 30
                        ? "bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20"
                        : item.status === "COMPLETED"
                        ? "hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10"
                        : "hover:bg-blue-50/30 dark:hover:bg-blue-950/10"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        idx === 0 ? "bg-yellow-400 text-yellow-900"
                        : idx === 1 ? "bg-gray-300 text-gray-700"
                        : idx === 2 ? "bg-amber-600/20 text-amber-700"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      }`}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-700 dark:text-blue-400 text-xs whitespace-nowrap">{item.opd?.code || ""}</td>
                    <td className="px-4 py-3 max-w-[200px] lg:max-w-[260px]">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.lokasi || ""}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{item.kategori}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatRupiah(item.nilai)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-black ${progresTextColor(item.progres)}`}>{item.progres}%</span>
                        <div className="w-14 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div className={`h-full rounded-full ${progresColor(item.progres)} transition-all duration-500`} style={{ width: `${Math.min(item.progres, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">{statusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-right text-[11px] text-gray-400 whitespace-nowrap hidden lg:table-cell">{formatTanggal(item.updatedAt)}</td>
                  </tr>
                ))}
                {recentUpdates.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <FileText className="h-8 w-8" />
                        <p className="text-sm">Belum ada data paket untuk tahun {tahun}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {recentUpdates.length > 0 && (
            <div className="px-5 py-3 border-t bg-gray-50 dark:bg-gray-800/50 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Menampilkan {recentUpdates.length} pembaruan terkini</span>
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-400" /> Progres rendah</span>
                <span className="inline-flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-400" /> Selesai</span>
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}