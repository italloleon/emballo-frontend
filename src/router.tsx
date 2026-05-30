import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import ErrorPage from '@/components/ErrorPage'
import { useAuthStore, type Role } from '@/store/auth'

import LandingPage from '@/features/auth/LandingPage'
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import JoinPage from '@/features/auth/JoinPage'

import AdminDashboard from '@/features/admin/Dashboard'
import AdminStudents from '@/features/admin/Students'
import AdminStudentDetail from '@/features/admin/StudentDetail'
import AdminStudentInvite from '@/features/admin/StudentInvite'
import AdminInstructors from '@/features/admin/Instructors'
import AdminInstructorInvite from '@/features/admin/InstructorInvite'
import AdminLeagues from '@/features/admin/Leagues'
import AdminLeagueDetail from '@/features/admin/LeagueDetail'
import AdminPrizes from '@/features/admin/Prizes'
import AdminMachines from '@/features/admin/Machines'
import AdminMachineDetail from '@/features/admin/MachineDetail'
import AdminInstructorDetail from '@/features/admin/InstructorDetail'
import AdminQrCodes from '@/features/admin/QrCodes'
import AdminSettings from '@/features/admin/Settings'
import AdminTrainingPlanGenerate from '@/features/admin/TrainingPlanGenerate'
import AdminStudentCalendar from '@/features/admin/StudentCalendar'

import InstructorDashboard from '@/features/instructor/Dashboard'
import InstructorTrainingPlans from '@/features/instructor/TrainingPlans'
import InstructorTrainingPlanNew from '@/features/instructor/TrainingPlanNew'
import InstructorTrainingPlanDetail from '@/features/instructor/TrainingPlanDetail'
import InstructorTrainingPlanGenerate from '@/features/instructor/TrainingPlanGenerate'
import InstructorStudents from '@/features/instructor/Students'
import InstructorStudentDetail from '@/features/instructor/StudentDetail'
import InstructorStudentCalendar from '@/features/instructor/StudentCalendar'

import FeedPage from '@/features/feed/FeedPage'
import StudentHome from '@/features/student/Home'
import StudentLeague from '@/features/student/League'
import StudentCheckin from '@/features/student/Checkin'
import StudentTraining from '@/features/student/Training'
import StudentCalendar from '@/features/student/Calendar'
import StudentHistory from '@/features/student/History'
import StudentProfile from '@/features/student/Profile'
import StudentPrizes from '@/features/student/Prizes'

import { PageShell } from '@/components/layout/PageShell'

function RequireAuth() {
  const { token } = useAuthStore()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

function RequireRole({ roles, title }: { roles: Role[]; title: string }) {
  const { user } = useAuthStore()

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <PageShell title={title} />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/join/:token',
    element: <JoinPage />,
    errorElement: <ErrorPage />,
  },
  {
    element: <RequireAuth />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/admin',
        element: <RequireRole roles={['admin']} title="Dashboard" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'feed', element: <FeedPage /> },
          { path: 'students', element: <AdminStudents /> },
          { path: 'students/invite', element: <AdminStudentInvite /> },
          { path: 'students/:id', element: <AdminStudentDetail /> },
          { path: 'students/:id/calendar', element: <AdminStudentCalendar /> },
          { path: 'instructors', element: <AdminInstructors /> },
          { path: 'instructors/invite', element: <AdminInstructorInvite /> },
          { path: 'instructors/:id', element: <AdminInstructorDetail /> },
          { path: 'leagues', element: <AdminLeagues /> },
          { path: 'leagues/:id', element: <AdminLeagueDetail /> },
          { path: 'prizes', element: <AdminPrizes /> },
          { path: 'machines', element: <AdminMachines /> },
          { path: 'machines/:id', element: <AdminMachineDetail /> },
          { path: 'qrcodes', element: <AdminQrCodes /> },
          { path: 'settings', element: <AdminSettings /> },
          { path: 'training-plans/generate', element: <AdminTrainingPlanGenerate /> },
        ],
      },
      {
        path: '/instructor',
        element: <RequireRole roles={['instructor']} title="Dashboard" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Navigate to="/instructor/dashboard" replace /> },
          { path: 'dashboard', element: <InstructorDashboard /> },
          { path: 'feed', element: <FeedPage /> },
          { path: 'training-plans', element: <InstructorTrainingPlans /> },
          { path: 'training-plans/new', element: <InstructorTrainingPlanNew /> },
          { path: 'training-plans/generate', element: <InstructorTrainingPlanGenerate /> },
          { path: 'training-plans/:id', element: <InstructorTrainingPlanDetail /> },
          { path: 'students', element: <InstructorStudents /> },
          { path: 'students/:id', element: <InstructorStudentDetail /> },
          { path: 'students/:id/calendar', element: <InstructorStudentCalendar /> },
        ],
      },
      {
        path: '/student',
        element: <RequireRole roles={['student']} title="Home" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Navigate to="/student/home" replace /> },
          { path: 'home', element: <StudentHome /> },
          { path: 'feed', element: <FeedPage /> },
          { path: 'league', element: <StudentLeague /> },
          { path: 'checkin', element: <StudentCheckin /> },
          { path: 'training', element: <StudentTraining /> },
          { path: 'calendar', element: <StudentCalendar /> },
          { path: 'history', element: <StudentHistory /> },
          { path: 'profile', element: <StudentProfile /> },
          { path: 'prizes', element: <StudentPrizes /> },
        ],
      },
    ],
  },
])
