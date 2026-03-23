import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timeoutRef = useRef(null)

  const showToast = useCallback(({ message, type = 'info' }) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setToast({ message, type })
    timeoutRef.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setToast(null)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          onClick={dismiss}
          className={`fixed left-4 right-4 bottom-20 z-[35] px-4 py-3 rounded-lg text-sm font-medium text-white text-center shadow-lg animate-slideUp transition cursor-pointer ${
            toast.type === 'success' ? 'bg-complete'
            : toast.type === 'error' ? 'bg-test'
            : 'bg-gray-700'
          }`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
