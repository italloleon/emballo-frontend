import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { router } from './router'
import { AppQueryProvider } from '@/providers/AppQueryProvider'
import { AuthBootstrap } from '@/components/AuthBootstrap'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppQueryProvider>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
    </AppQueryProvider>
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
