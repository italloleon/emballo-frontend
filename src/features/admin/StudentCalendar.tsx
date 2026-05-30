import { InstructorStudentCalendar } from '@/features/calendar/InstructorStudentCalendar'

export default function AdminStudentCalendarPage() {
  return (
    <InstructorStudentCalendar
      backPath="/admin/students/:id"
      backLabel="Voltar para Aluno"
    />
  )
}
