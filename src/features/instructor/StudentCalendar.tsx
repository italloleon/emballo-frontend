import { InstructorStudentCalendar } from '@/features/calendar/InstructorStudentCalendar'

export default function InstructorStudentCalendarPage() {
  return (
    <InstructorStudentCalendar
      backPath="/instructor/students/:id"
      backLabel="Voltar para Aluno"
    />
  )
}
