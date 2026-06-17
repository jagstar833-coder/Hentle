export type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent'
export type GameStatus = 'playing' | 'won' | 'lost'

export interface GuessRow {
  letters: string[]
  states: TileState[]
  isRevealing: boolean
}
