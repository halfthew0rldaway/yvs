import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import { Toaster } from 'react-hot-toast';

// Lazy-loaded route pages for code-splitting & fast initial load
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const CustomerList = lazy(() => import("./pages/customer/CustomerList"));
const CustomerForm = lazy(() => import("./pages/customer/CustomerForm"));
const PerangkatList = lazy(() => import("./pages/perangkat/PerangkatList"));
const PerangkatForm = lazy(() => import("./pages/perangkat/PerangkatForm"));
const TiketServisList = lazy(() => import("./pages/tiket-servis/TiketServisList"));
const TiketServisForm = lazy(() => import("./pages/tiket-servis/TiketServisForm"));
const TiketServisDetail = lazy(() => import("./pages/tiket-servis/TiketServisDetail"));
const DiagnosisForm = lazy(() => import("./pages/diagnosis/DiagnosisForm"));
const LogPerbaikanList = lazy(() => import("./pages/log-perbaikan/LogPerbaikanList"));
const SparepartList = lazy(() => import("./pages/sparepart/SparepartList"));
const SparepartForm = lazy(() => import("./pages/sparepart/SparepartForm"));
const InvoiceList = lazy(() => import("./pages/invoice/InvoiceList"));
const InvoiceForm = lazy(() => import("./pages/invoice/InvoiceForm"));
const InvoiceDetail = lazy(() => import("./pages/invoice/InvoiceDetail"));
const Tracking = lazy(() => import("./pages/tracking/Tracking"));
const UserList = lazy(() => import("./pages/user/UserList"));
const RepairWikiList = lazy(() => import("./pages/wiki/RepairWikiList"));
const RetensiCrm = lazy(() => import("./pages/retensi/RetensiCrm"));
const LoanerList = lazy(() => import("./pages/loaner/LoanerList"));
const RmaList = lazy(() => import("./pages/rma/RmaList"));
const DatabaseManagement = lazy(() => import("./pages/database/DatabaseManagement"));

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
        <>
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
                    <Route path="/invoice" element={<ProtectedRoute roles={["admin"]}><InvoiceList /></ProtectedRoute>} />
                    <Route path="/invoice/tambah" element={<ProtectedRoute roles={["admin"]}><InvoiceForm /></ProtectedRoute>} />
                    <Route path="/invoice/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute roles={["admin"]}><UserList /></ProtectedRoute>} />
                    <Route path="/database" element={<ProtectedRoute roles={["admin"]}><DatabaseManagement /></ProtectedRoute>} />
                    <Route path="/wiki" element={<ProtectedRoute><RepairWikiList /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Suspense>
        </>
    );
}
