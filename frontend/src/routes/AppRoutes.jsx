import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { LandownerLayout } from '../layouts/LandownerLayout';
import { PublicLayout } from '../layouts/PublicLayout';

// Public Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { UnauthorizedPage, NotFoundPage } from '../pages/UnauthorizedPage';

// Officer / Admin Pages
import { DashboardPage } from '../pages/officer/DashboardPage';
import { ProjectsListPage } from '../pages/projects/ProjectsListPage';
import { ProjectDetailsPage } from '../pages/projects/ProjectDetailsPage';
import { CasesListPage } from '../pages/cases/CasesListPage';
import { CaseDetailsPage } from '../pages/cases/CaseDetailsPage';
import { PredictionDetailsPage } from '../pages/cases/PredictionDetailsPage';
import { ParcelMapPage } from '../pages/maps/ParcelMapPage';
import { ParcelDetailsPage } from '../pages/maps/ParcelDetailsPage';
import { DocumentVerificationPage } from '../pages/documents/DocumentVerificationPage';
import { CompensationManagementPage } from '../pages/compensation/CompensationManagementPage';
import { TasksManagementPage } from '../pages/tasks/TasksManagementPage';
import { AlertsCenterPage } from '../pages/alerts/AlertsCenterPage';
import { GrievanceManagementPage } from '../pages/grievances/GrievanceManagementPage';
import { AdminUserManagementPage } from '../pages/admin/AdminUserManagementPage';
import { AdminVerificationDashboardPage } from '../pages/admin/AdminVerificationDashboardPage';

// Survey Officer Module Pages
import { SurveyDashboardPage } from '../pages/survey/SurveyDashboardPage';
import { SurveyRequestsListPage } from '../pages/survey/SurveyRequestsListPage';
import { SurveyExecutionPage } from '../pages/survey/SurveyExecutionPage';

// Landowner Pages
import { LandownerDashboardPage } from '../pages/landowner/LandownerDashboardPage';
import { LandownerParcelPage } from '../pages/landowner/LandownerParcelPage';
import { LandownerDocumentUploadPage } from '../pages/landowner/LandownerDocumentUploadPage';
import { LandownerGrievancePage } from '../pages/landowner/LandownerGrievancePage';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-govblue-700"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !isRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Shared Protected Routes (Map, Alerts) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'project_authority', 'land_acquisition_officer', 'survey_officer', 'compensation_officer', 'landowner']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/map" element={<ParcelMapPage />} />
        <Route path="/parcels/:id" element={<ParcelDetailsPage />} />
        <Route path="/alerts" element={<AlertsCenterPage />} />
      </Route>

      {/* Officer / Admin Protected Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'project_authority', 'land_acquisition_officer', 'survey_officer', 'compensation_officer']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailsPage />} />
        <Route path="/cases" element={<CasesListPage />} />
        <Route path="/cases/:id" element={<CaseDetailsPage />} />
        <Route path="/predictions/:id" element={<PredictionDetailsPage />} />
        <Route path="/documents" element={<DocumentVerificationPage />} />
        <Route path="/compensation" element={<CompensationManagementPage />} />
        <Route path="/tasks" element={<TasksManagementPage />} />
        <Route path="/grievances" element={<GrievanceManagementPage />} />
        <Route path="/admin/verifications" element={<AdminVerificationDashboardPage />} />
        <Route path="/admin/users" element={<AdminUserManagementPage />} />
      </Route>

      {/* Survey Officer Protected Routes (Strictly Survey Officer & Admin) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'survey_officer']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/survey/dashboard" element={<SurveyDashboardPage />} />
        <Route path="/survey/requests" element={<SurveyRequestsListPage />} />
        <Route path="/survey/execute/:id" element={<SurveyExecutionPage />} />
      </Route>

      {/* Landowner Protected Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['landowner', 'admin']}>
            <LandownerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/landowner" element={<LandownerDashboardPage />} />
        <Route path="/landowner/parcel/:id" element={<LandownerParcelPage />} />
        <Route path="/landowner/upload" element={<LandownerDocumentUploadPage />} />
        <Route path="/landowner/grievances" element={<LandownerGrievancePage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
