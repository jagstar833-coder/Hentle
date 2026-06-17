interface ToastProps {
  message: string | null
}

export default function Toast({ message }: ToastProps) {
  if (!message) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none toast-enter">
      <div className="bg-white text-black font-bold text-sm px-4 py-2 rounded-lg shadow-lg">
        {message}
      </div>
    </div>
  )
}
