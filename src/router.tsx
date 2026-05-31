import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import ErrorPage from '@/components/ErrorPage'
import { RouteLoading } from '@/components/RouteLoading'
import { useAuthStore, type Role } from '@/store/auth'
import { PageShell } from '@/components/layout/PageShell'

const LandingPage = lazy(() => import('@/features/auth/LandingPage'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'))
const JoinPage = lazy(() => import('@/features/auth/JoinPage'))

const AdminDashboard = lazy(() => import('@/features/admin/Dashboard'))
const AdminStudents = lazy(() => import('@/features/admin/Students'))
const AdminStudentDetail = lazy(() => import('@/features/admin/StudentDetail'))
const AdminStudentInvite = lazy(() => import('@/features/admin/StudentInvite'))
const AdminInstructors = lazy(() => import('@/features/admin/Instructors'))
const AdminInstructorInvite = lazy(() => import('@/features/admin/InstructorInvite'))
const AdminLeagues = lazy(() => import('@/features/admin/Leagues'))
const AdminLeagueDetail = lazy(() => import('@/features/admin/LeagueDetail'))
const AdminPrizes = lazy(() => import('@/features/admin/Prizes'))
const AdminMachines = lazy(() => import('@/features/admin/Machines'))
const AdminMachineDetail = lazy(() => import('@/features/admin/MachineDetail'))
const AdminInstructorDetail = lazy(() => import('@/features/admin/InstructorDetail'))
const AdminQrCodes = lazy(() => import('@/features/admin/QrCodes'))
const AdminSettings = lazy(() => import('@/features/admin/Settings'))
const AdminTrainingPlanGenerate = lazy(() => import('@/features/admin/TrainingPlanGenerate'))
const AdminStudentCalendar = lazy(() => import('@/features/admin/StudentCalendar'))

const InstructorDashboard = lazy(() => import('@/features/instructor/Dashboard'))
const InstructorTrainingPlans = lazy(() => import('@/features/instructor/TrainingPlans'))
const InstructorTrainingPlanNew = lazy(() => import('@/features/instructor/TrainingPlanNew'))
const InstructorTrainingPlanDetail = lazy(() => import('@/features/instructor/TrainingPlanDetail'))
const InstructorTrainingPlanGenerate = lazy(() => import('@/features/instructor/TrainingPlanGenerate'))
const InstructorStudents = lazy(() => import('@/features/instructor/Students'))
const InstructorStudentDetail = lazy(() => import('@/features/instructor/StudentDetail'))
const InstructorStudentCalendar = lazy(() => import('@/features/instructor/StudentCalendar'))

const FeedPage = lazy(() => import('@/features/feed/FeedPage'))
const StudentHome = lazy(() => import('@/features/student/Home'))
const StudentLeague = lazy(() => import('@/features/student/League'))
const StudentCheckin = lazy(() => import('@/features/student/Checkin'))
const StudentTraining = lazy(() => import('@/features/student/Training'))
const StudentCalendar = lazy(() => import('@/features/student/Calendar'))
const StudentHistory = lazy(() => import('@/features/student/History'))
const StudentProfile = lazy(() => import('@/features/student/Profile'))
const StudentPrizes = lazy(() => import('@/features/student/Prizes'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>
}

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
    element: (
      <Lazy>
        <LandingPage />
      </Lazy>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    element: (
      <Lazy>
        <LoginPage />
      </Lazy>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/register',
    element: (
      <Lazy>
        <RegisterPage />
      </Lazy>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/join/:token',
    element: (
      <Lazy>
        <JoinPage />
      </Lazy>
    ),
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
          {
            path: 'dashboard',
            element: (
              <Lazy>
                <AdminDashboard />
              </Lazy>
            ),
          },
          {
            path: 'feed',
            element: (
              <Lazy>
                <FeedPage />
              </Lazy>
            ),
          },
          {
            path: 'students',
            element: (
              <Lazy>
                <AdminStudents />
              </Lazy>
            ),
          },
          {
            path: 'students/invite',
            element: (
              <Lazy>
                <AdminStudentInvite />
              </Lazy>
            ),
          },
          {
            path: 'students/:id',
            element: (
              <Lazy>
                <AdminStudentDetail />
              </Lazy>
            ),
          },
          {
            path: 'students/:id/calendar',
            element: (
              <Lazy>
                <AdminStudentCalendar />
              </Lazy>
            ),
          },
          {
            path: 'instructors',
            element: (
              <Lazy>
                <AdminInstructors />
              </Lazy>
            ),
          },
          {
            path: 'instructors/invite',
            element: (
              <Lazy>
                <AdminInstructorInvite />
              </Lazy>
            ),
          },
          {
            path: 'instructors/:id',
            element: (
              <Lazy>
                <AdminInstructorDetail />
              </Lazy>
            ),
          },
          {
            path: 'leagues',
            element: (
              <Lazy>
                <AdminLeagues />
              </Lazy>
            ),
          },
          {
            path: 'leagues/:id',
            element: (
              <Lazy>
                <AdminLeagueDetail />
              </Lazy>
            ),
          },
          {
            path: 'prizes',
            element: (
              <Lazy>
                <AdminPrizes />
              </Lazy>
            ),
          },
          {
            path: 'machines',
            element: (
              <Lazy>
                <AdminMachines />
              </Lazy>
            ),
          },
          {
            path: 'machines/:id',
            element: (
              <Lazy>
                <AdminMachineDetail />
              </Lazy>
            ),
          },
          {
            path: 'qrcodes',
            element: (
              <Lazy>
                <AdminQrCodes />
              </Lazy>
            ),
          },
          {
            path: 'settings',
            element: (
              <Lazy>
                <AdminSettings />
              </Lazy>
            ),
          },
          {
            path: 'training-plans/generate',
            element: (
              <Lazy>
                <AdminTrainingPlanGenerate />
              </Lazy>
            ),
          },
        ],
      },
      {
        path: '/instructor',
        element: <RequireRole roles={['instructor']} title="Dashboard" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Navigate to="/instructor/dashboard" replace /> },
          {
            path: 'dashboard',
            element: (
              <Lazy>
                <InstructorDashboard />
              </Lazy>
            ),
          },
          {
            path: 'feed',
            element: (
              <Lazy>
                <FeedPage />
              </Lazy>
            ),
          },
          {
            path: 'training-plans',
            element: (
              <Lazy>
                <InstructorTrainingPlans />
              </Lazy>
            ),
          },
          {
            path: 'training-plans/new',
            element: (
              <Lazy>
                <InstructorTrainingPlanNew />
              </Lazy>
            ),
          },
          {
            path: 'training-plans/generate',
            element: (
              <Lazy>
                <InstructorTrainingPlanGenerate />
              </Lazy>
            ),
          },
          {
            path: 'training-plans/:id',
            element: (
              <Lazy>
                <InstructorTrainingPlanDetail />
              </Lazy>
            ),
          },
          {
            path: 'students',
            element: (
              <Lazy>
                <InstructorStudents />
              </Lazy>
            ),
          },
          {
            path: 'students/:id',
            element: (
              <Lazy>
                <InstructorStudentDetail />
              </Lazy>
            ),
          },
          {
            path: 'students/:id/calendar',
            element: (
              <Lazy>
                <InstructorStudentCalendar />
              </Lazy>
            ),
          },
        ],
      },
      {
        path: '/student',
        element: <RequireRole roles={['student']} title="Home" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Navigate to="/student/home" replace /> },
          {
            path: 'home',
            element: (
              <Lazy>
                <StudentHome />
              </Lazy>
            ),
          },
          {
            path: 'feed',
            element: (
              <Lazy>
                <FeedPage />
              </Lazy>
            ),
          },
          {
            path: 'league',
            element: (
              <Lazy>
                <StudentLeague />
              </Lazy>
            ),
          },
          {
            path: 'checkin',
            element: (
              <Lazy>
                <StudentCheckin />
              </Lazy>
            ),
          },
          {
            path: 'training',
            element: (
              <Lazy>
                <StudentTraining />
              </Lazy>
            ),
          },
          {
            path: 'calendar',
            element: (
              <Lazy>
                <StudentCalendar />
              </Lazy>
            ),
          },
          {
            path: 'history',
            element: (
              <Lazy>
                <StudentHistory />
              </Lazy>
            ),
          },
          {
            path: 'profile',
            element: (
              <Lazy>
                <StudentProfile />
              </Lazy>
            ),
          },
          {
            path: 'prizes',
            element: (
              <Lazy>
                <StudentPrizes />
              </Lazy>
            ),
          },
        ],
      },
    ],
  },
])
