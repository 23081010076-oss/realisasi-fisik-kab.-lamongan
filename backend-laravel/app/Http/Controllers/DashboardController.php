<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paket;
use App\Models\Opd;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $tahun = $request->input('tahun', date('Y'));

        $baseQuery = Paket::where('tahun', $tahun);

        $konstruksi = (clone $baseQuery)->where('kategori', 'KONSTRUKSI')->count();
        $konsultansi = (clone $baseQuery)->where('kategori', 'KONSULTANSI')->count();
        $barang = (clone $baseQuery)->where('kategori', 'BARANG')->count();
        $jasaLainnya = (clone $baseQuery)->where('kategori', 'JASA_LAINNYA')->count();

        $agg = (clone $baseQuery)->selectRaw('SUM(nilai) as total_nilai, SUM(nilai_realisasi) as total_realisasi, AVG(progres) as avg_progres')->first();

        $statuses = (clone $baseQuery)->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $statusData = [];
        foreach ($statuses as $status => $count) {
            $statusData[strtolower($status)] = $count;
        }

        $totalNilai = $agg->total_nilai ?? 0;
        $totalRealisasi = $agg->total_realisasi ?? 0;
        
        return response()->json([
            'tahun' => (int) $tahun,
            'kategori' => [
                'konstruksi' => $konstruksi,
                'konsultansi' => $konsultansi,
                'barang' => $barang,
                'jasaLainnya' => $jasaLainnya,
                'total' => $konstruksi + $konsultansi + $barang + $jasaLainnya,
            ],
            'nilai' => [
                'total' => $totalNilai,
                'realisasi' => $totalRealisasi,
                'persentase' => $totalNilai > 0 ? round(($totalRealisasi / $totalNilai) * 100, 2) : 0,
            ],
            'progres' => [
                'average' => round($agg->avg_progres ?? 0, 2),
            ],
            'status' => $statusData
        ]);
    }

    public function getChartData(Request $request)
    {
        $tahun = $request->input('tahun', date('Y'));

        $monthlyDataRaw = DB::table('paket')
            ->select(DB::raw('MONTH(updated_at) as month, COUNT(*) as count, SUM(nilai_realisasi) as total_realisasi, AVG(progres) as avg_progres'))
            ->where('tahun', $tahun)
            ->groupBy(DB::raw('MONTH(updated_at)'))
            ->orderBy('month')
            ->get();

        $monthly = $monthlyDataRaw->map(function ($item) {
            return [
                'month' => (int) $item->month,
                'count' => (int) $item->count,
                'totalRealisasi' => (float) ($item->total_realisasi ?? 0),
                'avgProgres' => (float) ($item->avg_progres ?? 0),
            ];
        });

        $categoryDataRaw = DB::table('paket')
            ->select('kategori', DB::raw('count(*) as count'), DB::raw('SUM(nilai) as total_nilai'), DB::raw('SUM(nilai_realisasi) as total_realisasi'))
            ->where('tahun', $tahun)
            ->groupBy('kategori')
            ->get();

        $category = $categoryDataRaw->map(function ($item) {
            return [
                'kategori' => $item->kategori,
                'count' => (int) $item->count,
                'totalNilai' => (float) ($item->total_nilai ?? 0),
                'totalRealisasi' => (float) ($item->total_realisasi ?? 0),
            ];
        });

        $opdDataRaw = DB::table('paket')
            ->select('opd_id', DB::raw('count(*) as count'), DB::raw('SUM(nilai) as total_nilai'), DB::raw('SUM(nilai_realisasi) as total_realisasi'))
            ->where('tahun', $tahun)
            ->groupBy('opd_id')
            ->orderBy('total_nilai', 'desc')
            ->take(10)
            ->get();

        $opdIds = $opdDataRaw->pluck('opd_id')->toArray();
        $opds = Opd::whereIn('id', $opdIds)->select('id', 'name', 'code')->get()->keyBy('id');

        $opd = $opdDataRaw->map(function ($item) use ($opds) {
            return [
                'opd' => $opds[$item->opd_id] ?? null,
                'count' => (int) $item->count,
                'totalNilai' => (float) ($item->total_nilai ?? 0),
                'totalRealisasi' => (float) ($item->total_realisasi ?? 0),
            ];
        });

        return response()->json([
            'monthly' => $monthly,
            'category' => $category,
            'opd' => $opd,
        ]);
    }

    public function getRecentUpdates(Request $request)
    {
        $limit = $request->input('limit', 10);
        $recent = Paket::with(['opd' => function($q) {
            $q->select('id', 'name', 'code');
        }])->orderBy('updated_at', 'desc')->take($limit)->get();

        return response()->json($recent);
    }

    public function getRekapData(Request $request)
    {
        $tahun = $request->input('tahun', date('Y'));

        $data = DB::table('paket')
            ->select('opd_id', DB::raw('count(*) as count'), DB::raw('SUM(pagu) as pagu'), DB::raw('SUM(nilai) as nilai'), DB::raw('SUM(nilai_realisasi) as nilai_realisasi'), DB::raw('AVG(progres) as avg_progres'))
            ->where('tahun', $tahun)
            ->groupBy('opd_id')
            ->get();

        $opdIds = $data->pluck('opd_id')->filter()->toArray();
        $opds = Opd::whereIn('id', $opdIds)->select('id', 'name', 'code')->get()->keyBy('id');

        $rows = [];
        foreach ($data as $d) {
            if (!$d->opd_id) continue;

            $nilai = $d->nilai ?? 0;
            $realisasi = $d->nilai_realisasi ?? 0;
            $pctKeuangan = $nilai > 0 ? round(($realisasi / $nilai) * 100, 2) : 0;

            $rows[] = [
                'opd' => $opds[$d->opd_id] ?? null,
                'jumlahKegiatan' => (int) $d->count,
                'paguAnggaran' => (float) ($d->pagu ?? 0),
                'nilaiKontrak' => (float) $nilai,
                'realisasiKeuangan' => (float) $realisasi,
                'realisasiFisik' => round((float) ($d->avg_progres ?? 0), 2),
                'pctKeuangan' => $pctKeuangan
            ];
        }

        usort($rows, function ($a, $b) {
            return $b['nilaiKontrak'] <=> $a['nilaiKontrak'];
        });

        $totals = [
            'jumlahKegiatan' => array_sum(array_column($rows, 'jumlahKegiatan')),
            'paguAnggaran' => array_sum(array_column($rows, 'paguAnggaran')),
            'nilaiKontrak' => array_sum(array_column($rows, 'nilaiKontrak')),
            'realisasiKeuangan' => array_sum(array_column($rows, 'realisasiKeuangan')),
        ];

        $totals['realisasiFisik'] = count($rows) > 0 ? round(array_sum(array_column($rows, 'realisasiFisik')) / count($rows), 2) : 0;
        $totals['pctKeuangan'] = $totals['nilaiKontrak'] > 0 ? round(($totals['realisasiKeuangan'] / $totals['nilaiKontrak']) * 100, 2) : 0;

        return response()->json([
            'tahun' => (int) $tahun,
            'rows' => $rows,
            'totals' => $totals,
        ]);
    }
}
