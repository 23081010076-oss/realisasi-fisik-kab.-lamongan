<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OpdController;
use App\Http\Controllers\PaketController;
use App\Http\Controllers\DashboardController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Dashboard public stats/charts
Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
Route::get('/dashboard/chart', [DashboardController::class, 'getChartData']);
Route::get('/dashboard/recent', [DashboardController::class, 'getRecentUpdates']);
Route::get('/dashboard/rekap', [DashboardController::class, 'getRekapData']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'getMe']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    
    // User
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);

    // Opd
    Route::get('/opd', [OpdController::class, 'index']);
    Route::post('/opd', [OpdController::class, 'store']);
    Route::get('/opd/{id}', [OpdController::class, 'show']);
    Route::put('/opd/{id}', [OpdController::class, 'update']);
    Route::delete('/opd/{id}', [OpdController::class, 'destroy']);
    Route::patch('/opd/{id}/toggle-status', [OpdController::class, 'toggleStatus']);

    // Paket
    Route::get('/paket', [PaketController::class, 'index']);
    Route::post('/paket', [PaketController::class, 'store']);
    Route::post('/paket/import', [PaketController::class, 'importExcel']);
    Route::get('/paket/export', [PaketController::class, 'exportExcel']);
    Route::get('/paket/{id}', [PaketController::class, 'show']);
    Route::put('/paket/{id}', [PaketController::class, 'update']);
    Route::delete('/paket/{id}', [PaketController::class, 'destroy']);
    Route::patch('/paket/{id}/status', [PaketController::class, 'updateStatus']);
    Route::post('/paket/{id}/progress', [PaketController::class, 'updateProgress']);
    Route::post('/paket/{id}/documents', [PaketController::class, 'uploadDocuments']);
    Route::delete('/paket/{id}/documents/{documentId}', [PaketController::class, 'deleteDocument']);
    Route::get('/documents/{documentId}/file', [PaketController::class, 'showDocumentFile']);
});
