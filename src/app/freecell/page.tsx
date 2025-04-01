'use client'
import { useState, useEffect, CSSProperties, useRef } from 'react'
import { Card } from './Card'
import { newGame } from './game'
import { CardSuitEnum } from './enum'
import { Poker } from './types'
import { DndContext, useDraggable, useDroppable, DragOverlay, CollisionDetection, rectIntersection } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
if (typeof window !== 'undefined') {
  // window.addEventListener('keydown', (e) => {
  //   console.log(e.key)
  // })
}

enum ColumnTypeEnum {
  HEADER_LEFT = "headerLeft",
  HEADER_RIGHT = "headerRight",
  COLUMN = "column",
}



const FreeCellColumnCard = ({ poker, index = 0, isDraggable, columnIndex, isHeader = false, type = ColumnTypeEnum.COLUMN, payloads = [], activeList = [] }: { poker: Poker, index?: number, isDraggable: boolean, columnIndex?: number, isHeader?: boolean, type?: ColumnTypeEnum, payloads?: Poker[], activeList?: Poker[] }) => {
  const gap = 35

  const initialStyle: CSSProperties = isHeader ? {} : {
    // transform: `translateY(${index * gap}px)`, position: 'absolute', top: 0, left: 0
  }
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${poker.point}-${poker.suit}`,
    data: {
      poker,
      columnIndex: columnIndex,
      originalIndex: index,
      type: type,
      payloads: type === ColumnTypeEnum.COLUMN ? payloads : [poker]
    },
    disabled: !isDraggable
  });
  const isActive = activeList.some(item => item.point === poker.point && item.suit === poker.suit)
  const style: CSSProperties = {
    ...initialStyle,
    opacity: isActive || transform ? 0.6 : 1,
  };


  return (
    <Card poker={poker} ref={setNodeRef} key={index} style={style}  {...attributes} {...listeners}></Card>
  )
}


const checkSuit = (poker: Poker, nextPoker: Poker) => {
  if (poker.suit === CardSuitEnum.HEART || poker.suit === CardSuitEnum.DIAMOND) {
    return nextPoker.suit === CardSuitEnum.SPADE || nextPoker.suit === CardSuitEnum.CLUB
  }
  return nextPoker.suit === CardSuitEnum.HEART || nextPoker.suit === CardSuitEnum.DIAMOND
}


const checkIsDraggable = (poker: Poker, payloads: Poker[], canMoveNum: number) => {
  if (payloads.length === 1) return true
  for (let i = 0; i < payloads.length; i++) {
    if (i === payloads.length - 1) return true
    // check suit
    if (!checkSuit(payloads[i], payloads[i + 1])) return false
    // check point
    if (payloads[i].point !== payloads[i + 1].point + 1) return false
    // check  num
    if (payloads.length > canMoveNum) return false
  }
  return true
}

const FreeCellColumn = ({ list, index, activeList, canMoveNum = 1 }: { list: Poker[], index: number, activeList: Poker[], canMoveNum: number }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${index}`,
    data: {
      columnIndex: index,
      type: ColumnTypeEnum.COLUMN,
      payloads: list
    },
  });

  const style = {
    backgroundColor: isOver ? 'red' : 'transparent',
  }


  const isDraggable = (index: number) => {
    return checkIsDraggable(list[index], list.filter((_, listIndex) => listIndex >= index), canMoveNum)
  }

  return (
    <div className={`stack-container flex flex-col border border-gray-200 rounded-xs h-full`} ref={setNodeRef} style={style}>
      {list.map((poker, listIndex) => (
        <FreeCellColumnCard key={`${poker.point}-${poker.suit}`} poker={poker} index={listIndex} isDraggable={
          isDraggable(listIndex)} columnIndex={index} payloads={list.filter((_, index) => index >= listIndex)} activeList={activeList} />
      ))}
    </div>
  )
}

const HeaderEmpty = ({ poker, index, isDraggable = true, type = ColumnTypeEnum.HEADER_LEFT }: { poker: Poker | null, index: number, isDraggable?: boolean, type?: ColumnTypeEnum }) => {
  if (!poker) return <Card ></Card>
  return (
    <FreeCellColumnCard poker={poker} isHeader={true} columnIndex={index} isDraggable={isDraggable} type={type}></FreeCellColumnCard>
  )
}


const HeaderLeftItem = ({ index, poker }: { index: number, poker: Poker | null }) => {
  const { setNodeRef } = useDroppable({
    id: `header-left-${index}`,
    data: {
      columnIndex: index,
      type: ColumnTypeEnum.HEADER_LEFT
    },
    disabled: poker !== null
  });

  // const style = isOver ? {
  //   backgroundColor: 'red',
  // } : {
  //   backgroundColor: 'blue',
  // }

  return (
    <div key={index} ref={setNodeRef}  className="stack-container">
      <HeaderEmpty poker={poker} index={index} isDraggable={poker !== null} />
    </div>
  )
}

const FreecellHeaderLeft = ({ headerLeft }: { headerLeft: (Poker | null)[] }) => {
  return (
    <div className="flex gap-4">
      {headerLeft.map((poker, index) => (
        <HeaderLeftItem key={index} index={index} poker={poker} />
      ))}
    </div>
  )
}

const HeaderRightItem = ({ index, list }: { index: number, list: Poker[] }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `header-right-${index}`,
    data: {
      columnIndex: index,
      type: ColumnTypeEnum.HEADER_RIGHT
    },
  });

  const style = isOver ? {
    backgroundColor: 'red',
  } : {
    backgroundColor: '',
  }

  const lastPoker = list?.[list.length - 1] ?? null

  const currentColumnSuit = Object.values(CardSuitEnum)[index]

  return (
    <div>
      {currentColumnSuit}
      <div key={index} ref={setNodeRef} style={style} className="stack-container">
        <HeaderEmpty poker={lastPoker} index={index} type={ColumnTypeEnum.HEADER_RIGHT} />
      </div>
    </div>
  )
}

const FreecellHeaderRight = ({ headerRight }: { headerRight: Poker[][] }) => {
  return (
    <div className="flex gap-4">
      {headerRight.map((list, index) => (
        <HeaderRightItem key={index} index={index} list={list} />
      ))}
    </div>
  )
}


const COLUMNS = 8

const removeFromColumn = (list: Poker[], payloads: Poker[]) => {
  const tempColumn = [...list]
  if (!tempColumn) return list
  const filterSet = new Set(payloads.map(item => `${item.point}-${item.suit}`))
  const filteredColumn = tempColumn.filter(item => !filterSet.has(`${item.point}-${item.suit}`))
  return filteredColumn
}

const addToColumn = (list: Poker[], payloads: Poker[]) => {
  const tempColumn = [...list, ...payloads]
  return tempColumn
}

const handleColumnOver = (event, targetBoard: Board) => {
  const { over, active } = event
  const payloads = active.data.current?.payloads
  const columnIndex = over?.data.current?.columnIndex

  targetBoard.column[columnIndex] = addToColumn(targetBoard.column[columnIndex], payloads)
}

const handleColumnActive = (event, targetBoard: Board) => {
  const { active } = event
  const payloads = active.data.current?.payloads
  const columnIndex = active?.data.current?.columnIndex
  targetBoard.column[columnIndex] = removeFromColumn(targetBoard.column[columnIndex], payloads)
}

const handleHeaderLeftOver = (event, targetBoard: Board) => {
  const { over, active } = event
  const payloads = active.data.current?.payloads
  const columnIndex = over?.data.current?.columnIndex
  if (payloads.length > 1) return
  if (columnIndex === null) return
  targetBoard.headerLeft[columnIndex] = payloads[0]
}

const handleHeaderLeftActive = (event, targetBoard: Board) => {
  const { active } = event
  const columnIndex = active?.data.current?.columnIndex
  targetBoard.headerLeft[columnIndex] = null
}

const handleHeaderRightOver = (event, targetBoard: Board) => {
  const { over, active } = event
  const payloads = active.data.current?.payloads
  const columnIndex = over?.data.current?.columnIndex
  targetBoard.headerRight[columnIndex].push(...payloads)
}

const handleHeaderRightActive = (event, tagetBoard: Board) => {
  const { active } = event
  const columnIndex = active?.data.current?.columnIndex
  tagetBoard.headerRight[columnIndex].pop()
}

type Board = {
  column: Poker[][],
  headerLeft: (Poker | null)[],
  headerRight: (Poker)[][],
}

const calculateCanMoveNum = (emptyColumnNum: number, headerLeftEmptyNum: number) => {
  return (emptyColumnNum + 1) * (headerLeftEmptyNum + 1)
}

const checkIsWin = (board: Board) => {
  return board.column.every(column => {
    return column.every((poker, index) => {
      if(index === column.length - 1) return true
      if(poker.point !== column[index + 1].point + 1) return false
      if(!checkSuit(poker, column[index + 1])) return false
      return true
    } )
  })
}

const FreecellBoard = () => {
  const game = useRef(newGame())
  const [board, setBoard] = useState<Board>({
    column: [...game.current],
    headerLeft: Array.from({ length: 4 }, () => null),
    headerRight: Array.from({ length: 4 }, () => []),
  })
  const [isClient, setIsClient] = useState(false)
  const [activeList, setActiveList] = useState<Poker[]>([])
  useEffect(() => {
    setIsClient(true)
  }, [])
  if (!isClient) return null


  const handleDragStart = (event) => {
    console.log('event', event)
    if (event?.active?.data?.current?.type === ColumnTypeEnum.COLUMN) {
      const columnIndex = event.active.data.current?.columnIndex
      const originalIndex = event.active.data.current?.originalIndex
      const filteredList = board.column[columnIndex].filter((_, index) => index >= originalIndex)
      if (filteredList.length > 0) {
        return setActiveList([...filteredList])
      }
    }
    setActiveList([event.active.data.current?.poker])
  }



  const handleDragEnd = (event) => {
    setActiveList([])
    console.log('event', event)
    const { active, over } = event;
    const overType = over?.data?.current?.type
    const activeType = active?.data?.current?.type
    if (!overType || !activeType) return
    if (activeType === ColumnTypeEnum.COLUMN && overType === ColumnTypeEnum.COLUMN) {
      if (active?.data?.current?.columnIndex === over?.data?.current?.columnIndex) return
    } else if (activeType === overType) {
      return
    }
    if (overType === ColumnTypeEnum.HEADER_LEFT || overType === ColumnTypeEnum.HEADER_RIGHT) {
      if (active?.data?.current?.payloads.length > 1) return
    }

    if (overType === ColumnTypeEnum.HEADER_RIGHT) {
      const currentColumnIndex = over?.data?.current?.columnIndex
      const currentColumnSuit = Object.values(CardSuitEnum)[currentColumnIndex]
      const activePoker = active?.data?.current?.payloads[0]
      if (activePoker?.suit !== currentColumnSuit) return

      const column = board.headerRight[currentColumnIndex]

      const lastPokerPoint = column?.[column.length - 1]?.point || 0
      if (activePoker?.point !== lastPokerPoint + 1) return
    }

    if (overType === ColumnTypeEnum.COLUMN) {
      const columnIndex = over?.data?.current?.columnIndex
      const lastColumnPoker = board.column[columnIndex]?.[board.column[columnIndex].length - 1]
      if (lastColumnPoker) {
        if (lastColumnPoker.point !== active?.data?.current?.payloads[0].point + 1) return
        if (!checkSuit(lastColumnPoker, active?.data?.current?.payloads[0])) return
      }
    }

    const tampBoard = { ...board }
    switch (overType) {
      case ColumnTypeEnum.HEADER_LEFT:
        handleHeaderLeftOver(event, tampBoard)
        break
      case ColumnTypeEnum.HEADER_RIGHT:
        handleHeaderRightOver(event, tampBoard)
        break
      default:
        handleColumnOver(event, tampBoard)
        break
    }
    switch (activeType) {
      case ColumnTypeEnum.HEADER_LEFT:
        handleHeaderLeftActive(event, tampBoard)
        break
      case ColumnTypeEnum.HEADER_RIGHT:
        handleHeaderRightActive(event, tampBoard)
        break
      default:
        handleColumnActive(event, tampBoard)
        break
    }
    setBoard(tampBoard)

  }


  const fixCursorSnapOffset: CollisionDetection = (args) => {
    // Bail out if keyboard activated
    if (!args.pointerCoordinates) {
      return rectIntersection(args);
    }
    const { x, y } = args.pointerCoordinates;
    const { width, height } = args.collisionRect;
    const updated = {
      ...args,
      // The collision rectangle is broken when using snapCenterToCursor. Reset
      // the collision rectangle based on pointer location and overlay size.
      collisionRect: {
        width,
        height,
        bottom: y + height / 2,
        left: x - width / 2,
        right: x + width / 2,
        top: y - height / 2,
      },
    };
    return rectIntersection(updated);
  };

  console.log('board', board)

  const canMoveNum = calculateCanMoveNum(board.column.filter(item => item.length === 0).length, board.headerLeft.filter(item => item === null).length)

  const isWin = checkIsWin(board)

  return (
    <div className="flex flex-col h-screen gap-2">
      {/* <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={fixCursorSnapOffset}> */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} >
        {/* <DndContext > */}
        <h1 className="text-2xl font-bold text-center">Freecell Board</h1>
        <div className="flex justify-between">
          <FreecellHeaderLeft headerLeft={board.headerLeft} />
          <div className='flex flex-col gap-2'>
            <div>can move num: {canMoveNum}</div>
            <div>is win: {isWin ? 'yes' : 'no'}</div>
            <button className='bg-blue-500 text-white px-2 py-1 rounded-md' >restart</button>
            <button className='bg-blue-500 text-white px-2 py-1 rounded-md' >back step</button>
          </div>
          <FreecellHeaderRight headerRight={board.headerRight} />
        </div>
        <div className="grid grid-cols-8 gap-4 flex-1">
          {Array.from({ length: COLUMNS }).map((_, index) => (
            <FreeCellColumn key={index} list={board.column[index]} index={index} activeList={activeList} canMoveNum={canMoveNum} />
          ))}
          {/* <DragOverlay modifiers={[snapCenterToCursor]}> */}
          <DragOverlay>
            {activeList && <div className='stack-container'>{activeList.map(el => <Card poker={el} key={`${el.point}-${el.suit}`} />)}</div>}
          </DragOverlay>
        </div>
      </DndContext>
    </div>
  )
}


export default function Freecell() {
  return <FreecellBoard />
}
