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

import { Toaster } from 'react-hot-toast';

function ProtectedRoute({ children }) {
    const { token, loading } = useAuth();

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
                <Route path="/customer/tambah" element={<ProtectedRoute><CustomerForm /></ProtectedRoute>} />
                <Route path="/customer/edit/:id" element={<ProtectedRoute><CustomerForm /></ProtectedRoute>} />
                <Route path="/perangkat" element={<ProtectedRoute><PerangkatList /></ProtectedRoute>} />
                <Route path="/perangkat/tambah" element={<ProtectedRoute><PerangkatForm /></ProtectedRoute>} />
                <Route path="/perangkat/edit/:id" element={<ProtectedRoute><PerangkatForm /></ProtectedRoute>} />
                <Route path="/tiket-servis" element={<ProtectedRoute><TiketServisList /></ProtectedRoute>} />
                <Route path="/tiket-servis/tambah" element={<ProtectedRoute><TiketServisForm /></ProtectedRoute>} />
                <Route path="/tiket-servis/:id" element={<ProtectedRoute><TiketServisDetail /></ProtectedRoute>} />
                <Route path="/tiket-servis/:id/diagnosis" element={<ProtectedRoute><DiagnosisForm /></ProtectedRoute>} />
                <Route path="/tiket-servis/:id/log" element={<ProtectedRoute><LogPerbaikanList /></ProtectedRoute>} />
                <Route path="/sparepart" element={<ProtectedRoute><SparepartList /></ProtectedRoute>} />
                <Route path="/sparepart/tambah" element={<ProtectedRoute><SparepartForm /></ProtectedRoute>} />
                <Route path="/sparepart/edit/:id" element={<ProtectedRoute><SparepartForm /></ProtectedRoute>} />
                <Route path="/invoice" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
                <Route path="/invoice/tambah" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
                <Route path="/invoice/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </>
    );
}
