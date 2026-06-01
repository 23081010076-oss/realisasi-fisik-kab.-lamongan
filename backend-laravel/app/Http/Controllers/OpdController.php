<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Opd;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Validator;

class OpdController extends Controller
{
    public function index(Request $request)
    {
        $query = Opd::withCount(['pakets', 'users']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('isActive')) {
            $query->where('is_active', $request->isActive === 'true');
        }

        $opds = $query->orderBy('name', 'asc')->get();
        return response()->json($opds);
    }

    public function show($id)
    {
        $opd = Opd::withCount(['pakets', 'users'])
            ->with(['users' => function ($q) {
                $q->select('id', 'opd_id', 'email', 'name', 'role', 'is_active');
            }, 'pakets' => function ($q) {
                $q->orderBy('updated_at', 'desc')->take(10);
            }])
            ->find($id);

        if (!$opd) {
            return response()->json(['error' => 'OPD not found'], 404);
        }

        return response()->json($opd);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|unique:opd,code',
            'name' => 'required',
            'kepala' => 'nullable',
            'contact' => 'nullable',
            'address' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $opd = Opd::create($request->only('code', 'name', 'kepala', 'contact', 'address'));

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'CREATE',
            'entity' => 'OPD',
            'entity_id' => $opd->id,
            'details' => ['name' => $opd->name, 'code' => $opd->code],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($opd, 201);
    }

    public function update(Request $request, $id)
    {
        $opd = Opd::find($id);
        if (!$opd) {
            return response()->json(['error' => 'OPD not found'], 404);
        }

        $data = $request->only('code', 'name', 'kepala', 'contact', 'address');
        $opd->update($data);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'UPDATE',
            'entity' => 'OPD',
            'entity_id' => $opd->id,
            'details' => $data,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($opd);
    }

    public function destroy(Request $request, $id)
    {
        $opd = Opd::withCount('pakets')->find($id);
        
        if (!$opd) {
            return response()->json(['error' => 'OPD not found'], 404);
        }

        if ($opd->pakets_count > 0) {
            return response()->json(['error' => 'Cannot delete OPD with existing pakets'], 400);
        }

        $opd->delete();

        return response()->json(['message' => 'OPD deleted successfully']);
    }

    public function toggleStatus(Request $request, $id)
    {
        $opd = Opd::find($id);

        if (!$opd) {
            return response()->json(['error' => 'OPD not found'], 404);
        }

        $opd->update(['is_active' => !$opd->is_active]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'UPDATE',
            'entity' => 'OPD',
            'entity_id' => $opd->id,
            'details' => ['action' => 'toggle_status', 'is_active' => $opd->is_active],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($opd);
    }
}
