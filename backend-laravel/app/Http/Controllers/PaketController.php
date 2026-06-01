<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paket;
use App\Models\PaketProgress;
use App\Models\AuditLog;
use App\Models\Document;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\PaketImport;
use App\Exports\PaketExport;

class PaketController extends Controller
{
    public function index(Request $request)
    {
        $query = Paket::with(['opd' => function ($q) {
            $q->select('id', 'name', 'code');
        }]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('kegiatan', 'like', "%{$search}%")
                  ->orWhere('lokasi', 'like', "%{$search}%");
            });
        }

        if ($request->filled('kategori')) {
            $query->where('kategori', $request->kategori);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('opdId')) {
            $query->where('opd_id', $request->opdId);
        }
        if ($request->filled('tahun')) {
            $query->where('tahun', $request->tahun);
        }

        $user = $request->user();
        if ($user->role === 'OPD' && $user->opd_id) {
            $query->where('opd_id', $user->opd_id);
        }

        $limit = $request->input('limit', 10);
        
        // Cloned queries for aggregates
        $aggQuery = clone $query;
        $totalPagu = $aggQuery->sum('pagu');
        $totalNilai = $aggQuery->sum('nilai');
        $totalNilaiRealisasi = $aggQuery->sum('nilai_realisasi');
        $avgProgres = $aggQuery->avg('progres');

        $paginator = $query->orderBy('updated_at', 'desc')->paginate($limit);

        $avgKeuangan = $totalNilai > 0 ? ($totalNilaiRealisasi / $totalNilai) * 100 : 0;

        return response()->json([
            'data' => $paginator->items(),
            'pagination' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'totalPages' => $paginator->lastPage(),
            ],
            'totals' => [
                'pagu' => $totalPagu,
                'nilai' => $totalNilai,
                'sisa' => $totalPagu - $totalNilai,
                'nilaiRealisasi' => $totalNilaiRealisasi,
                'avgFisik' => round($avgProgres ?? 0, 1),
                'avgKeuangan' => round($avgKeuangan, 1),
                'count' => $paginator->total(),
            ]
        ]);
    }

    public function show(Request $request, $id)
    {
        $paket = Paket::with(['opd', 'progress' => function ($q) {
            $q->orderBy('tanggal', 'desc')->take(20);
        }, 'documents'])->find($id);

        if (!$paket) {
            return response()->json(['error' => 'Paket not found'], 404);
        }

        $user = $request->user();
        if ($user->role === 'OPD' && $paket->opd_id !== $user->opd_id) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        return response()->json($paket);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $finalOpdId = $user->role === 'OPD' ? $user->opd_id : ($request->opd_id ?? $request->opdId);

        if (!$finalOpdId) {
            return response()->json(['error' => 'OPD is required'], 400);
        }

        $tahun = $request->tahun ?? date('Y');
        $code = $request->code ?: 'PKT-' . $tahun . '-' . time();

        $paket = Paket::create([
            'code' => $code,
            'name' => $request->name,
            'kategori' => $request->kategori,
            'opd_id' => $finalOpdId,
            'kegiatan' => $request->kegiatan,
            'lokasi' => $request->lokasi,
            'pagu' => $request->pagu ?? 0,
            'nilai' => $request->nilai ?? 0,
            'nilai_realisasi' => $request->nilaiRealisasi ?? 0,
            'progres' => $request->progres ?? 0,
            'tahun' => $tahun,
            'tanggal_mulai' => $request->tanggalMulai,
            'tanggal_selesai' => $request->tanggalSelesai,
            'keterangan' => $request->keterangan,
            'nomor_kontrak' => $request->nomorKontrak,
            'no_spmk' => $request->noSPMK,
            'sumber_dana' => $request->sumberDana ?? 'APBD',
            'pelaksana' => $request->pelaksana,
            'kode_rekening' => $request->kodeRekening,
            'status' => 'PENDING'
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'CREATE',
            'entity' => 'Paket',
            'entity_id' => $paket->id,
            'details' => ['name' => $paket->name, 'code' => $paket->code],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($paket->load('opd'), 201);
    }

    public function update(Request $request, $id)
    {
        $paket = Paket::find($id);
        if (!$paket) {
            return response()->json(['error' => 'Paket not found'], 404);
        }

        $user = $request->user();
        if ($user->role === 'OPD' && $paket->opd_id !== $user->opd_id) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $data = $request->except(['id', 'created_at', 'updated_at']);
        
        // Map camelCase to snake_case for DB fields if necessary
        if ($request->has('opdId')) $data['opd_id'] = $request->opdId;
        if ($request->has('tanggalMulai')) $data['tanggal_mulai'] = $request->tanggalMulai;
        if ($request->has('tanggalSelesai')) $data['tanggal_selesai'] = $request->tanggalSelesai;
        if ($request->has('nilaiRealisasi')) $data['nilai_realisasi'] = $request->nilaiRealisasi;
        if ($request->has('nomorKontrak')) $data['nomor_kontrak'] = $request->nomorKontrak;
        if ($request->has('noSPMK')) $data['no_spmk'] = $request->noSPMK;
        if ($request->has('sumberDana')) $data['sumber_dana'] = $request->sumberDana;
        if ($request->has('kodeRekening')) $data['kode_rekening'] = $request->kodeRekening;

        $paket->update($data);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'UPDATE',
            'entity' => 'Paket',
            'entity_id' => $paket->id,
            'details' => $data,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($paket->fresh('opd'));
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'ADMIN') {
            return response()->json(['error' => 'Only admin can delete paket'], 403);
        }

        $paket = Paket::find($id);
        if (!$paket) {
            return response()->json(['error' => 'Paket not found'], 404);
        }

        $paket->delete();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'DELETE',
            'entity' => 'Paket',
            'entity_id' => $id,
            'details' => ['name' => $paket->name],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Paket deleted successfully']);
    }

    public function updateStatus(Request $request, $id)
    {
        $validStatuses = ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"];
        if (!in_array($request->status, $validStatuses)) {
            return response()->json(['error' => 'Invalid status'], 400);
        }

        $paket = Paket::find($id);
        if (!$paket) {
            return response()->json(['error' => 'Paket not found'], 404);
        }

        $user = $request->user();
        if ($user->role === 'OPD' && $paket->opd_id !== $user->opd_id) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $oldStatus = $paket->status;
        $paket->update(['status' => $request->status]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'UPDATE',
            'entity' => 'Paket',
            'entity_id' => $paket->id,
            'details' => ['action' => 'update_status', 'oldStatus' => $oldStatus, 'newStatus' => $request->status],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($paket->fresh('opd'));
    }

    public function updateProgress(Request $request, $id)
    {
        $paket = Paket::find($id);
        if (!$paket) {
            return response()->json(['error' => 'Paket not found'], 404);
        }

        $user = $request->user();
        if ($user->role === 'OPD' && $paket->opd_id !== $user->opd_id) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        PaketProgress::create([
            'paket_id' => $id,
            'progres' => $request->progres,
            'nilai_realisasi' => $request->nilaiRealisasi,
            'keterangan' => $request->keterangan,
        ]);

        $paket->update([
            'progres' => $request->progres,
            'nilai_realisasi' => $request->nilaiRealisasi,
        ]);

        return response()->json($paket->load(['opd', 'progress' => function ($q) {
            $q->orderBy('tanggal', 'desc')->take(10);
        }]));
    }

    public function importExcel(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'File Excel tidak ditemukan'], 400);
        }

        $user = $request->user();
        $tahun = $request->input('tahun', date('Y'));
        $opdId = $user->role === 'OPD' ? $user->opd_id : $request->input('opdId');
        $sumberDana = $request->input('sumberDana', 'APBD');

        $import = new PaketImport($tahun, $opdId, $sumberDana);
        Excel::import($import, $request->file('file'));

        $errors = $import->getErrors();
        $inserted = $import->getInserted();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'IMPORT',
            'entity' => 'Paket',
            'entity_id' => null,
            'details' => ['inserted' => $inserted, 'errors' => count($errors), 'tahun' => $tahun],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => "{$inserted} paket berhasil diimport",
            'inserted' => $inserted,
            'errors' => $errors,
        ]);
    }

    public function uploadDocuments(Request $request, $id)
    {
        $paket = Paket::find($id);
        if (!$paket) {
            return response()->json(['error' => 'Paket not found'], 404);
        }

        $user = $request->user();
        if ($user->role === 'OPD' && $paket->opd_id !== $user->opd_id) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $validator = Validator::make($request->all(), [
            'files' => 'required',
            'files.*' => 'image|mimes:jpg,jpeg,png,webp|max:5120',
            'progressPercentage' => 'nullable|integer|min:0|max:100',
            'category' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $files = $request->file('files');
        if (!is_array($files)) {
            $files = [$files];
        }

        $uploadDir = public_path("uploads/paket-documents/{$paket->id}");
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $documents = [];
        foreach ($files as $file) {
            if (!$file || !$file->isValid()) {
                continue;
            }

            $originalName = $file->getClientOriginalName();
            $filename = uniqid('foto_', true) . '.' . $file->getClientOriginalExtension();
            $file->move($uploadDir, $filename);

            $documents[] = Document::create([
                'paket_id' => $paket->id,
                'name' => $originalName,
                'filename' => $filename,
                'filepath' => "/uploads/paket-documents/{$paket->id}/{$filename}",
                'filesize' => filesize($uploadDir . DIRECTORY_SEPARATOR . $filename) ?: 0,
                'mimetype' => mime_content_type($uploadDir . DIRECTORY_SEPARATOR . $filename) ?: $file->getClientMimeType(),
                'category' => $request->input('category'),
                'progress_percentage' => $request->input('progressPercentage'),
            ]);
        }

        if (empty($documents)) {
            return response()->json(['error' => 'Tidak ada foto valid yang diupload'], 400);
        }

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'UPLOAD_DOCUMENT',
            'entity' => 'Paket',
            'entity_id' => $paket->id,
            'details' => ['count' => count($documents)],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => count($documents) . ' foto berhasil diupload',
            'documents' => $documents,
        ], 201);
    }

    public function deleteDocument(Request $request, $id, $documentId)
    {
        $paket = Paket::find($id);
        if (!$paket) {
            return response()->json(['error' => 'Paket not found'], 404);
        }

        $user = $request->user();
        if ($user->role === 'OPD' && $paket->opd_id !== $user->opd_id) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $document = Document::where('paket_id', $paket->id)->find($documentId);
        if (!$document) {
            return response()->json(['error' => 'Foto tidak ditemukan'], 404);
        }

        $filePath = public_path(ltrim($document->filepath, '/\\'));
        if (is_file($filePath)) {
            unlink($filePath);
        }

        $document->delete();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'DELETE_DOCUMENT',
            'entity' => 'Paket',
            'entity_id' => $paket->id,
            'details' => ['documentId' => $documentId],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Foto berhasil dihapus']);
    }

    public function showDocumentFile(Request $request, $documentId)
    {
        $document = Document::with('paket')->find($documentId);
        if (!$document) {
            return response()->json(['error' => 'Foto tidak ditemukan'], 404);
        }

        $user = $request->user();
        if ($user->role === 'OPD' && $document->paket?->opd_id !== $user->opd_id) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        if (str_starts_with($document->filepath, 'http://') || str_starts_with($document->filepath, 'https://')) {
            return redirect()->away($document->filepath);
        }

        $filePath = public_path(ltrim($document->filepath, '/\\'));
        if (!is_file($filePath)) {
            return response()->json(['error' => 'File foto tidak ditemukan'], 404);
        }

        return response()->file($filePath, [
            'Content-Type' => $document->mimetype ?: mime_content_type($filePath),
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    public function exportExcel(Request $request)
    {
        $user = $request->user();
        $params = $request->only(['tahun', 'opdId', 'kategori', 'status']);

        if ($user->role === 'OPD') {
            $params['opdId'] = $user->opd_id;
        }

        $filename = 'paket-' . ($params['tahun'] ?? date('Y')) . '-' . now()->format('YmdHis') . '.xlsx';

        return Excel::download(new PaketExport($params), $filename);
    }
}
