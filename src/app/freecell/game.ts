import { CardSuitEnum } from "./enum"
import { shuffle } from "@/utils/array"
import { Poker } from "./types"

const PokerLength = 52

export const generatePoker = (): Poker[] => {
  const pokers: Poker[] = Array.from({ length: PokerLength }, (_, index) => {
    const suit = Math.floor(index / 13)
    const point = index % 13 + 1
    return {
      suit: Object.values(CardSuitEnum)[suit],
      point,
    }
  })
  return pokers
}


export const newGame = (): Poker[][] => {
  const Columns = 8
  const pokers = generatePoker()
  const shuffledPokers = shuffle<Poker>(pokers)
  const board: Poker[][] = Array.from({ length: Columns }, () => [])
  for (let i = 0; i < shuffledPokers.length; i++) {
    board[i % Columns].push(shuffledPokers[i])
  }
  return board
}