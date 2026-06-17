import { Link } from 'react-router-dom'

interface HeaderProps {
  onHelp: () => void
  onShare?: () => void
  gameOver: boolean
}

export default function Header({ onHelp, onShare, gameOver }: HeaderProps) {
  return (
    <header className="w-full border-b border-dark-300 flex items-center justify-between px-4 h-14 max-w-[500px] mx-auto">
      <button
        onClick={onHelp}
        className="text-dark-100 hover:text-white transition-colors p-2 text-xl"
        aria-label="Help"
      >
        ?
      </button>

      <h1 className="text-2xl font-black tracking-widest text-white select-none">
        HENTLE
      </h1>

      <div className="flex items-center gap-2">
        {gameOver && onShare && (
          <button
            onClick={onShare}
            className="text-xs bg-[#538d4e] hover:bg-[#6aaf63] text-white px-3 py-1.5 rounded font-bold transition-colors"
          >
            Share
          </button>
        )}
        <Link
          to="/admin"
          className="text-dark-100 hover:text-white transition-colors p-2 text-sm"
          aria-label="Admin"
        >
          ⚙
        </Link>
      </div>
    </header>
  )
}
