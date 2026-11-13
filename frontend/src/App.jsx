
import { Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from 'react-hot-toast';
import { lazyWithRetry } from "./utils/lazyWithRetry";
import api from "./services/api";
import { landingRouteFor } from "./utils/landingRoute";

// Lazy-loaded route pages with automatic chunk refresh retry on new deployments
const Login = lazyWithRetry(() => import("./pages/Login"));
const DownloadApp = lazyWithRetry(() => import("./pages/DownloadApp"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Dashboard = lazyWithRetry(() => import("./pages/dashboard/Dashboard"));
const CustomerList = lazyWithRetry(() => import("./pages/customer/CustomerList"));
const CustomerForm = lazyWithRetry(() => import("./pages/customer/CustomerForm"));
const PerangkatList = lazyWithRetry(() => import("./pages/perangkat/PerangkatList"));
const PerangkatForm = lazyWithRetry(() => import("./pages/perangkat/PerangkatForm"));
const TiketServisList = lazyWithRetry(() => import("./pages/tiket-servis/TiketServisList"));
const TiketServisForm = lazyWithRetry(() => import("./pages/tiket-servis/TiketServisForm"));
const TiketServisDetail = lazyWithRetry(() => import("./pages/tiket-servis/TiketServisDetail"));
const DiagnosisForm = lazyWithRetry(() => import("./pages/diagnosis/DiagnosisForm"));
const LogPerbaikanList = lazyWithRetry(() => import("./pages/log-perbaikan/LogPerbaikanList"));
const SparepartList = lazyWithRetry(() => import("./pages/sparepart/SparepartList"));
const SparepartForm = lazyWithRetry(() => import("./pages/sparepart/SparepartForm"));
const InvoiceList = lazyWithRetry(() => import("./pages/invoice/InvoiceList"));
const InvoiceForm = lazyWithRetry(() => import("./pages/invoice/InvoiceForm"));
const InvoiceDetail = lazyWithRetry(() => import("./pages/invoice/InvoiceDetail"));
const Tracking = lazyWithRetry(() => import("./pages/tracking/Tracking"));
const CustomerRegistration = lazyWithRetry(() => import("./pages/tracking/CustomerRegistration"));
const UserList = lazyWithRetry(() => import("./pages/user/UserList"));
const RoleManagement = lazyWithRetry(() => import("./pages/user/RoleManagement"));
const RepairWikiList = lazyWithRetry(() => import("./pages/wiki/RepairWikiList"));
const RecruitmentDashboard = lazyWithRetry(() => import("./pages/recruitment/RecruitmentDashboard"));
const JobPostingForm = lazyWithRetry(() => import("./pages/recruitment/JobPostingForm"));
const RetensiCrm = lazyWithRetry(() => import("./pages/retensi/RetensiCrm"));
const LoanerList = lazyWithRetry(() => import("./pages/loaner/LoanerList"));
const RmaList = lazyWithRetry(() => import("./pages/rma/RmaList"));
const RmaForm = lazyWithRetry(() => import("./pages/rma/RmaForm"));
const SupplierList = lazyWithRetry(() => import("./pages/supplier/SupplierList"));
const DatabaseManagement = lazyWithRetry(() => import("./pages/database/DatabaseManagement"));
const AuditLogList = lazyWithRetry(() => import("./pages/audit/AuditLogList"));
const AttendancePage = lazyWithRetry(() => import("./pages/attendance/AttendancePage"));

function PageLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="relative w-10 h-10">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Memuat Halaman...</p>
        </div>
    );
}

function hasActiveToken(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return Number(payload.exp) * 1000 > Date.now();
    } catch {
        return false;
    }
}

function LandingRedirect() {
    const { token, user, updateUser, logout } = useAuth();
    const [destination, setDestination] = useState(null);
    const [failed, setFailed] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        if (!token) return;
        let active = true;
        setDestination(null);
        setFailed(false);
        api.get("/auth/me", { skipCache: true }).then(response => {
            if (!active) return;
            updateUser(response.data);
            setDestination(landingRouteFor(response.data));
        }).catch(error => {
            if (!active) return;
            if (error.response?.status === 401) {
                logout();
            } else if (typeof navigator !== "undefined" && navigator.onLine === false && hasActiveToken(token)) {
                setDestination(landingRouteFor(user));
            } else {
                setFailed(true);
            }
        });
        return () => { active = false; };
    }, [token, updateUser, logout, retry]);

    if (!token) return <Navigate to="/login" replace />;
    if (destination) return <Navigate to={destination} replace />;
    if (failed) return <div className="mx-auto max-w-lg p-6 text-sm text-slate-700">Gagal memeriksa hak akses. <button type="button" className="font-semibold text-blue-600" onClick={() => setRetry(value => value + 1)}>Coba lagi</button></div>;
    return <PageLoader />;
}

function ProtectedRoute({ children, permissions, superAdmin = false }) {
    const { token, user, loading, updateUser } = useAuth();
    const location = useLocation();
    const [authorization, setAuthorization] = useState(null);
    const routeKey = `${token || ""}:${location.pathname}`;

    useEffect(() => {
        if (!token) return;
        let active = true;
        api.get("/auth/me", { skipCache: true }).then(response => {
            if (!active) return;
            updateUser(response.data);
            setAuthorization({ key: routeKey, user: response.data });
        }).catch(error => {
            if (!active) return;
            const offline = !error.response && typeof navigator !== "undefined" && navigator.onLine === false;
            setAuthorization({ key: routeKey, user: offline && hasActiveToken(token) ? user : null });
        });
        return () => { active = false; };
    }, [routeKey, token, updateUser]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-slate-500">Memuat...</div>
            </div>
        );
    }

    if (!token) {
        const redirectParam = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
    }

    if (authorization?.key !== routeKey) return <div className="p-4 text-sm text-slate-500">Memeriksa hak akses…</div>;
    const currentUser = authorization.user;
    const allowed = currentUser && (!superAdmin || currentUser.is_super_admin) && (!permissions?.length || currentUser.is_super_admin || permissions.some(permission => currentUser.permissions?.includes(permission)));
    if (!allowed) {
        return <div className="mx-auto max-w-lg p-6 text-sm text-slate-700">Anda tidak memiliki hak akses ke halaman ini.</div>;
    }

    return <Layout>{children}</Layout>;
}

export default function App() {
    return (
        <ErrorBoundary>
            <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium text-slate-900', style: { borderRadius: '12px', padding: '16px' } }} />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/download" element={<DownloadApp />} />
                    <Route path="/tracking" element={<Tracking />} />
                    <Route path="/tracking/register" element={<CustomerRegistration />} />

                    {/* Protected routes */}
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute permissions={["dashboard.view"]}><Dashboard /></ProtectedRoute>} />
                    <Route path="/customer" element={<ProtectedRoute permissions={["customers.view"]}><CustomerList /></ProtectedRoute>} />
                    <Route path="/customer/tambah" element={<ProtectedRoute permissions={["customers.manage"]}><CustomerForm /></ProtectedRoute>} />
                    <Route path="/customer/edit/:id" element={<ProtectedRoute permissions={["customers.manage"]}><CustomerForm /></ProtectedRoute>} />
                    <Route path="/perangkat" element={<ProtectedRoute permissions={["devices.view"]}><PerangkatList /></ProtectedRoute>} />
                    <Route path="/perangkat/tambah" element={<ProtectedRoute permissions={["devices.manage"]}><PerangkatForm /></ProtectedRoute>} />
                    <Route path="/perangkat/edit/:id" element={<ProtectedRoute permissions={["devices.manage"]}><PerangkatForm /></ProtectedRoute>} />
                    <Route path="/tiket-servis" element={<ProtectedRoute permissions={["tickets.view"]}><TiketServisList /></ProtectedRoute>} />
                    <Route path="/tiket-servis/tambah" element={<ProtectedRoute permissions={["tickets.intake"]}><TiketServisForm /></ProtectedRoute>} />
                    <Route path="/tiket-servis/:id" element={<ProtectedRoute permissions={["tickets.view"]}><TiketServisDetail /></ProtectedRoute>} />
                    <Route path="/tiket-servis/:id/diagnosis" element={<ProtectedRoute permissions={["tickets.diagnosis"]}><DiagnosisForm /></ProtectedRoute>} />
                    <Route path="/tiket-servis/:id/log" element={<ProtectedRoute permissions={["tickets.view"]}><LogPerbaikanList /></ProtectedRoute>} />
                    <Route path="/retensi" element={<ProtectedRoute permissions={["crm.view"]}><RetensiCrm /></ProtectedRoute>} />
                    <Route path="/loaner" element={<ProtectedRoute permissions={["loaners.view"]}><LoanerList /></ProtectedRoute>} />
                    <Route path="/sparepart" element={<ProtectedRoute permissions={["inventory.view"]}><SparepartList /></ProtectedRoute>} />
                    <Route path="/sparepart/tambah" element={<ProtectedRoute permissions={["inventory.manage"]}><SparepartForm /></ProtectedRoute>} />
                    <Route path="/sparepart/edit/:id" element={<ProtectedRoute permissions={["inventory.manage"]}><SparepartForm /></ProtectedRoute>} />
                    <Route path="/rma" element={<ProtectedRoute permissions={["suppliers.view"]}><RmaList /></ProtectedRoute>} />
                    <Route path="/rma/tambah" element={<ProtectedRoute permissions={["suppliers.manage"]}><RmaForm /></ProtectedRoute>} />
                    <Route path="/rma/create" element={<ProtectedRoute permissions={["suppliers.manage"]}><RmaForm /></ProtectedRoute>} />
                    <Route path="/rma/new" element={<ProtectedRoute permissions={["suppliers.manage"]}><RmaForm /></ProtectedRoute>} />
                    <Route path="/supplier" element={<ProtectedRoute permissions={["suppliers.view"]}><SupplierList /></ProtectedRoute>} />
                    <Route path="/suppliers" element={<ProtectedRoute permissions={["suppliers.view"]}><SupplierList /></ProtectedRoute>} />
                    <Route path="/invoice" element={<ProtectedRoute permissions={["invoices.view"]}><InvoiceList /></ProtectedRoute>} />
                    <Route path="/invoice/tambah" element={<ProtectedRoute permissions={["invoices.manage"]}><InvoiceForm /></ProtectedRoute>} />
                    <Route path="/invoice/:id" element={<ProtectedRoute permissions={["invoices.view"]}><InvoiceDetail /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute superAdmin><UserList /></ProtectedRoute>} />
                    <Route path="/roles" element={<ProtectedRoute superAdmin><RoleManagement /></ProtectedRoute>} />
                    <Route path="/database" element={<ProtectedRoute permissions={["system.database"]}><DatabaseManagement /></ProtectedRoute>} />
                    <Route path="/audit-log" element={<ProtectedRoute permissions={["audit.view"]}><AuditLogList /></ProtectedRoute>} />
                    <Route path="/wiki" element={<ProtectedRoute permissions={["wiki.view"]}><RepairWikiList /></ProtectedRoute>} />
                    <Route path="/attendance" element={<ProtectedRoute permissions={["attendance.self", "attendance.review", "attendance.adjust", "attendance.policy"]}><AttendancePage /></ProtectedRoute>} />
                    <Route path="/recruitment" element={<ProtectedRoute permissions={["recruitment.view"]}><RecruitmentDashboard /></ProtectedRoute>} />
                    <Route path="/recruitment/jobs/tambah" element={<ProtectedRoute permissions={["recruitment.manage"]}><JobPostingForm /></ProtectedRoute>} />
                    <Route path="/recruitment/jobs/edit/:id" element={<ProtectedRoute permissions={["recruitment.manage"]}><JobPostingForm /></ProtectedRoute>} />

                    <Route path="*" element={<LandingRedirect />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}
