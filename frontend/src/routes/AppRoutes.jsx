import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { FullPageLoader } from "../components/ui/FullPageLoader";
import { useAuth } from "../features/auth/AuthContext";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { NotAuthorizedPage } from "../pages/NotAuthorizedPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { EmployeesPage } from "../pages/EmployeesPage";
import { EmployeeDetailsPage } from "../pages/EmployeeDetailsPage";
import { EmployeeFormPage } from "../pages/EmployeeFormPage";
import { DepartmentsPage } from "../pages/DepartmentsPage";
import { DepartmentDetailsPage } from "../pages/DepartmentDetailsPage";
import { DepartmentFormPage } from "../pages/DepartmentFormPage";
import { AttendancePage } from "../pages/AttendancePage";
import { AttendanceDetailsPage } from "../pages/AttendanceDetailsPage";
import { AttendanceFormPage } from "../pages/AttendanceFormPage";
import { PerformanceReviewsPage } from "../pages/PerformanceReviewsPage";
import { PerformanceReviewDetailsPage } from "../pages/PerformanceReviewDetailsPage";
import { PerformanceReviewFormPage } from "../pages/PerformanceReviewFormPage";
import { SurveysPage } from "../pages/SurveysPage";
import { SurveyDetailsPage } from "../pages/SurveyDetailsPage";
import { SurveyFormPage } from "../pages/SurveyFormPage";
import { FeedbackPage } from "../pages/FeedbackPage";
import { FeedbackDetailsPage } from "../pages/FeedbackDetailsPage";
import { FeedbackFormPage } from "../pages/FeedbackFormPage";
import { CopilotPage } from "../pages/CopilotPage";
import { ManagerCoachPage } from "../pages/ManagerCoachPage";

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <FullPageLoader label="Restoring your secure session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/not-authorized" replace />;

  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader label="Loading PulseHR…" />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="employees" element={<ProtectedRoute roles={["manager", "hr", "admin"]}><EmployeesPage /></ProtectedRoute>} />
        <Route path="employees/new" element={<ProtectedRoute roles={["hr", "admin"]}><EmployeeFormPage /></ProtectedRoute>} />
        <Route path="employees/:id" element={<EmployeeDetailsPage />} />
        <Route path="employees/:id/edit" element={<ProtectedRoute roles={["hr", "admin"]}><EmployeeFormPage /></ProtectedRoute>} />
        <Route path="departments" element={<ProtectedRoute roles={["hr", "admin"]}><DepartmentsPage /></ProtectedRoute>} />
        <Route path="departments/new" element={<ProtectedRoute roles={["hr", "admin"]}><DepartmentFormPage /></ProtectedRoute>} />
        <Route path="departments/:id" element={<ProtectedRoute roles={["hr", "admin"]}><DepartmentDetailsPage /></ProtectedRoute>} />
        <Route path="departments/:id/edit" element={<ProtectedRoute roles={["hr", "admin"]}><DepartmentFormPage /></ProtectedRoute>} />
        <Route path="attendance" element={<ProtectedRoute roles={["manager", "hr", "admin"]}><AttendancePage /></ProtectedRoute>} />
        <Route path="attendance/new" element={<ProtectedRoute roles={["hr", "admin"]}><AttendanceFormPage /></ProtectedRoute>} />
        <Route path="attendance/:id" element={<ProtectedRoute roles={["manager", "hr", "admin"]}><AttendanceDetailsPage /></ProtectedRoute>} />
        <Route path="attendance/:id/edit" element={<ProtectedRoute roles={["hr", "admin"]}><AttendanceFormPage /></ProtectedRoute>} />
        <Route path="performance-reviews" element={<ProtectedRoute roles={["manager", "hr", "admin"]}><PerformanceReviewsPage /></ProtectedRoute>} />
        <Route path="performance-reviews/new" element={<ProtectedRoute roles={["manager", "hr", "admin"]}><PerformanceReviewFormPage /></ProtectedRoute>} />
        <Route path="performance-reviews/:id" element={<ProtectedRoute roles={["manager", "hr", "admin"]}><PerformanceReviewDetailsPage /></ProtectedRoute>} />
        <Route path="performance-reviews/:id/edit" element={<ProtectedRoute roles={["manager", "hr", "admin"]}><PerformanceReviewFormPage /></ProtectedRoute>} />
        <Route path="surveys" element={<ProtectedRoute roles={["manager", "hr", "admin"]}><SurveysPage /></ProtectedRoute>} />
        <Route path="surveys/new" element={<ProtectedRoute><SurveyFormPage /></ProtectedRoute>} />
        <Route path="surveys/:id" element={<ProtectedRoute><SurveyDetailsPage /></ProtectedRoute>} />
        <Route path="feedback" element={<ProtectedRoute roles={["manager", "hr", "admin"]}><FeedbackPage /></ProtectedRoute>} />
        <Route path="feedback/new" element={<ProtectedRoute><FeedbackFormPage /></ProtectedRoute>} />
        <Route path="feedback/:id" element={<ProtectedRoute><FeedbackDetailsPage /></ProtectedRoute>} />
        <Route path="copilot" element={<ProtectedRoute><CopilotPage /></ProtectedRoute>} />
        <Route path="manager-coach" element={<ProtectedRoute roles={["manager", "hr", "admin"]}><ManagerCoachPage /></ProtectedRoute>} />
        <Route path="not-authorized" element={<NotAuthorizedPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
