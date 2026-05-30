import { create } from 'zustand'

interface Academy {
  id: string
  name: string
  slug: string
  city: string
  phone: string
}

interface AcademyState {
  academy: Academy | null
  setAcademy: (academy: Academy) => void
}

export const useAcademyStore = create<AcademyState>()(set => ({
  academy: null,
  setAcademy: academy => set({ academy }),
}))
