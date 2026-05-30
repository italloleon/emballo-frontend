import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { router } from './router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: '#1C1A1A',
          border: '1px solid #3A3735',
          color: '#F5F3F0',
        },
      }}
    />
  </StrictMode>,
)
