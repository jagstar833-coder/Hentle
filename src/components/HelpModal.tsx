interface HelpModalProps {
  onClose: () => void
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-500 border border-dark-300 rounded-xl p-6 max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg tracking-wider">HOW TO PLAY</h2>
          <button onClick={onClose} className="text-dark-100 hover:text-white text-2xl">×</button>
        </div>

        <p className="text-dark-100 text-sm mb-4">
          Guess the <span className="font-bold text-white">HENTLE</span> in 6 tries.
        </p>

        <ul className="text-dark-100 text-sm space-y-1 mb-4">
          <li>• Each guess must be a valid 5-letter word.</li>
          <li>• The color of the tiles will change to show how close your guess was.</li>
        </ul>

        <hr className="border-dark-300 mb-4" />

        <p className="text-white text-xs font-bold mb-3">EXAMPLES</p>

        <div className="space-y-3 mb-4">
          <div>
            <div className="flex gap-1 mb-1">
              {['W','E','A','R','Y'].map((l, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 flex items-center justify-center font-bold text-sm border-2 ${
                    i === 0 ? 'bg-[#538d4e] border-[#538d4e] text-white' : 'border-dark-300 text-white'
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-dark-100 text-xs"><span className="text-white font-bold">W</span> is in the word and in the correct spot.</p>
          </div>

          <div>
            <div className="flex gap-1 mb-1">
              {['P','I','L','L','S'].map((l, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 flex items-center justify-center font-bold text-sm border-2 ${
                    i === 1 ? 'bg-[#b59f3b] border-[#b59f3b] text-white' : 'border-dark-300 text-white'
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-dark-100 text-xs"><span className="text-white font-bold">I</span> is in the word but in the wrong spot.</p>
          </div>

          <div>
            <div className="flex gap-1 mb-1">
              {['V','A','G','U','E'].map((l, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 flex items-center justify-center font-bold text-sm border-2 ${
                    i === 3 ? 'bg-dark-300 border-dark-300 text-dark-100' : 'border-dark-300 text-white'
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-dark-100 text-xs"><span className="text-white font-bold">U</span> is not in the word in any spot.</p>
          </div>
        </div>

        <hr className="border-dark-300 mb-4" />
        <p className="text-dark-100 text-xs text-center">A new HENTLE will be available each day!</p>
      </div>
    </div>
  )
}
