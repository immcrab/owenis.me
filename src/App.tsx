import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthActionBridge } from "@/components/AuthActionBridge";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminRoute, ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import AdminActivityLogs from "@/pages/admin/AdminActivityLogs";
import AdminAiSettings from "@/pages/admin/AdminAiSettings";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminSubdomainRequests from "@/pages/admin/AdminSubdomainRequests";
import AdminUsers from "@/pages/admin/AdminUsers";
import AccountSettings from "@/pages/dashboard/AccountSettings";
import AiAssistant from "@/pages/dashboard/AiAssistant";
import AiEmailGenerator from "@/pages/dashboard/AiEmailGenerator";
import ConnectFirebase from "@/pages/dashboard/ConnectFirebase";
import Dashboard from "@/pages/dashboard/Dashboard";
import EmailConfig from "@/pages/dashboard/EmailConfig";
import SubdomainRequest from "@/pages/dashboard/SubdomainRequest";
import AuthAction from "@/pages/public/AuthAction";
import Docs from "@/pages/public/Docs";
import Features from "@/pages/public/Features";
import ForgotPassword from "@/pages/public/ForgotPassword";
import Home from "@/pages/public/Home";
import HowItWorks from "@/pages/public/HowItWorks";
import NotFound from "@/pages/public/NotFound";
import PublicProjects from "@/pages/public/PublicProjects";
import SignIn from "@/pages/public/SignIn";
import SignUp from "@/pages/public/SignUp";

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <AuthActionBridge />
          <ScrollToTop />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/projects" element={<PublicProjects />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/action" element={<AuthAction />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/connect" element={<ConnectFirebase />} />
              <Route path="/dashboard/email" element={<EmailConfig />} />
              <Route path="/dashboard/subdomain" element={<SubdomainRequest />} />
              <Route path="/dashboard/ai-email" element={<AiEmailGenerator />} />
              <Route path="/dashboard/assistant" element={<AiAssistant />} />
              <Route path="/dashboard/account" element={<AccountSettings />} />
            </Route>

            <Route
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/subdomains" element={<AdminSubdomainRequests />} />
              <Route path="/admin/projects" element={<AdminProjects />} />
              <Route path="/admin/ai" element={<AdminAiSettings />} />
              <Route path="/admin/activity" element={<AdminActivityLogs />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
}
