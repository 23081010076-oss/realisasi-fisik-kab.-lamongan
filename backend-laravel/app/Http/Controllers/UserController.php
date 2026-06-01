<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['opd' => function($q) {
            $q->select('id', 'name', 'code');
        }]);

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }
        if ($request->has('opdId')) {
            $query->where('opd_id', $request->opdId);
        }
        if ($request->has('isActive')) {
            $query->where('is_active', $request->isActive === 'true');
        }

        $users = $query->orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    public function show($id)
    {
        $user = User::with('opd')->find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }
        return response()->json($user);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required',
            'name' => 'required',
            'role' => 'nullable|in:ADMIN,OPD,VIEWER',
            'opd_id' => 'nullable|exists:opd,id',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'name' => $request->name,
            'role' => $request->role ?? 'VIEWER',
            'opd_id' => $request->opd_id,
            'is_active' => $request->has('is_active') ? $request->is_active : true,
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'CREATE',
            'entity' => 'User',
            'entity_id' => $user->id,
            'details' => ['email' => $user->email, 'name' => $user->name],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($user->load('opd'), 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $data = $request->except(['password']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        if (empty($data['opd_id']) && $request->has('opd_id')) {
            $data['opd_id'] = null;
        }

        $user->update($data);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'UPDATE',
            'entity' => 'User',
            'entity_id' => $user->id,
            'details' => $request->all(),
            'ip_address' => $request->ip(),
        ]);

        return response()->json($user->fresh('opd'));
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->id === $id) {
            return response()->json(['error' => 'Cannot delete your own account'], 400);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        AuditLog::where('user_id', $id)->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function toggleStatus(Request $request, $id)
    {
        if ($request->user()->id === $id) {
            return response()->json(['error' => 'Cannot toggle your own account status'], 400);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->update(['is_active' => !$user->is_active]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'UPDATE',
            'entity' => 'User',
            'entity_id' => $user->id,
            'details' => ['action' => 'toggle_status', 'is_active' => $user->is_active],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($user->fresh('opd'));
    }
}
