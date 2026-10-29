import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from 'react-hot-toast';
import { lazyWithRetry } from "./utils/lazyWithRetry";

// Lazy-loaded route pages with automatic chunk refresh retry on new deployments
const Login = lazyWithRetry(() => import("./pages/Login"));
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
const UserList = lazyWithRetry(() => import("./pages/user/UserList"));
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

function ProtectedRoute({ children, roles }) {
    const { token, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-slate-500">Memuat...</div>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
        return <Navigate to="/dashboard" replace />;
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
                    <Route path="/tracking" element={<Tracking />} />

                    {/* Protected routes */}
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/customer" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
                    <Route path="/customer/tambah" element={<ProtectedRoute roles={["admin"]}><CustomerForm /></ProtectedRoute>} />
                    <Route path="/customer/edit/:id" element={<ProtectedRoute roles={["admin"]}><CustomerForm /></ProtectedRoute>} />
                    <Route path="/perangkat" element={<ProtectedRoute><PerangkatList /></ProtectedRoute>} />
                    <Route path="/perangkat/tambah" element={<ProtectedRoute roles={["admin"]}><PerangkatForm /></ProtectedRoute>} />
                    <Route path="/perangkat/edit/:id" element={<ProtectedRoute roles={["admin"]}><PerangkatForm /></ProtectedRoute>} />
                    <Route path="/tiket-servis" element={<ProtectedRoute><TiketServisList /></ProtectedRoute>} />
                    <Route path="/tiket-servis/tambah" element={<ProtectedRoute roles={["admin"]}><TiketServisForm /></ProtectedRoute>} />
                    <Route path="/tiket-servis/:id" element={<ProtectedRoute><TiketServisDetail /></ProtectedRoute>} />
                    <Route path="/tiket-servis/:id/diagnosis" element={<ProtectedRoute><DiagnosisForm /></ProtectedRoute>} />
                    <Route path="/tiket-servis/:id/log" element={<ProtectedRoute><LogPerbaikanList /></ProtectedRoute>} />
                    <Route path="/retensi" element={<ProtectedRoute roles={["admin"]}><RetensiCrm /></ProtectedRoute>} />
                    <Route path="/loaner" element={<ProtectedRoute><LoanerList /></ProtectedRoute>} />
                    <Route path="/sparepart" element={<ProtectedRoute><SparepartList /></ProtectedRoute>} />
                    <Route path="/sparepart/tambah" element={<ProtectedRoute roles={["admin"]}><SparepartForm /></ProtectedRoute>} />
                    <Route path="/sparepart/edit/:id" element={<ProtectedRoute roles={["admin"]}><SparepartForm /></ProtectedRoute>} />
                    <Route path="/rma" element={<ProtectedRoute><RmaList /></ProtectedRoute>} />
                    <Route path="/rma/tambah" element={<ProtectedRoute><RmaForm /></ProtectedRoute>} />
                    <Route path="/rma/create" element={<ProtectedRoute><RmaForm /></ProtectedRoute>} />
                    <Route path="/rma/new" element={<ProtectedRoute><RmaForm /></ProtectedRoute>} />
                    <Route path="/supplier" element={<ProtectedRoute><SupplierList /></ProtectedRoute>} />
                    <Route path="/suppliers" element={<ProtectedRoute><SupplierList /></ProtectedRoute>} />
                    <Route path="/invoice" element={<ProtectedRoute roles={["admin"]}><InvoiceList /></ProtectedRoute>} />
                    <Route path="/invoice/tambah" element={<ProtectedRoute roles={["admin"]}><InvoiceForm /></ProtectedRoute>} />
                    <Route path="/invoice/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute roles={["admin"]}><UserList /></ProtectedRoute>} />
                    <Route path="/database" element={<ProtectedRoute roles={["admin"]}><DatabaseManagement /></ProtectedRoute>} />
                    <Route path="/audit-log" element={<ProtectedRoute roles={["admin"]}><AuditLogList /></ProtectedRoute>} />
                    <Route path="/wiki" element={<ProtectedRoute><RepairWikiList /></ProtectedRoute>} />
                    <Route path="/recruitment" element={<ProtectedRoute roles={["admin"]}><RecruitmentDashboard /></ProtectedRoute>} />
                    <Route path="/recruitment/jobs/tambah" element={<ProtectedRoute roles={["admin"]}><JobPostingForm /></ProtectedRoute>} />
                    <Route path="/recruitment/jobs/edit/:id" element={<ProtectedRoute roles={["admin"]}><JobPostingForm /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}
