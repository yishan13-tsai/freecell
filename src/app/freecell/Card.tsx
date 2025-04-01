'use client'
import { Poker } from "./types"
import { CardSuitEnum } from "./enum"
const CardSuit = {
  [CardSuitEnum.SPADE]: '♠',
  [CardSuitEnum.HEART]: '♥',
  [CardSuitEnum.DIAMOND]: '♦',
  [CardSuitEnum.CLUB]: '♣',
}

const ColorMap = {
  [CardSuitEnum.SPADE]: 'text-black',
  [CardSuitEnum.HEART]: 'text-red-500',
  [CardSuitEnum.DIAMOND]: 'text-red-500',
  [CardSuitEnum.CLUB]: 'text-black',
}

export const Card = ({poker, style, className, ...props}: {poker?: Poker, style?: React.CSSProperties, className?: string, ref?: any, props?: any}) => {
  const cardOuter = 'w-24 h-32 rounded-xs border border-gray-300 '
  const cardInner = 'flex  items-center justify-center'

  if(!poker) {
    return <div className={`${cardOuter} ${className}` }></div>
  }

  return (
    <div className={`${cardOuter} bg-white card`} style={style}  {...props}>
      <div className={`${cardInner} ${ColorMap[poker?.suit]}`}>

        <div className="text-2xl font-bold">{poker?.point}</div>
        <div className="text-2xl font-bold ml-2">{CardSuit[poker?.suit]}</div>
      </div>
    </div>
  )
}
