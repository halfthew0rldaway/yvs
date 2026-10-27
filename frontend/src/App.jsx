import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Dashboard from "./pages/dashboard/Dashboard";
import CustomerList from "./pages/customer/CustomerList";
import CustomerForm from "./pages/customer/CustomerForm";
import PerangkatList from "./pages/perangkat/PerangkatList";
import PerangkatForm from "./pages/perangkat/PerangkatForm";
import TiketServisList from "./pages/tiket-servis/TiketServisList";
import TiketServisForm from "./pages/tiket-servis/TiketServisForm";
import TiketServisDetail from "./pages/tiket-servis/TiketServisDetail";
import DiagnosisForm from "./pages/diagnosis/DiagnosisForm";
import LogPerbaikanList from "./pages/log-perbaikan/LogPerbaikanList";
import SparepartList from "./pages/sparepart/SparepartList";
import SparepartForm from "./pages/sparepart/SparepartForm";
import InvoiceList from "./pages/invoice/InvoiceList";
import InvoiceForm from "./pages/invoice/InvoiceForm";
import InvoiceDetail from "./pages/invoice/InvoiceDetail";
import Tracking from "./pages/tracking/Tracking";
import UserList from "./pages/user/UserList";
import RepairWikiList from "./pages/wiki/RepairWikiList";
import RetensiCrm from "./pages/retensi/RetensiCrm";
import LoanerList from "./pages/loaner/LoanerList";
import RmaList from "./pages/rma/RmaList";
import DatabaseManagement from "./pages/database/DatabaseManagement";

import { Toaster } from 'react-hot-toast';

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
        </>
    );
}
