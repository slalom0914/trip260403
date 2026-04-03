import { useLayoutEffect, useRef } from 'react'
import sidoSvgRaw from '../../assets/우리나라지도/전국_시도_경계1.svg?raw'
import styles from './koreaSidoMap.module.css'

/**
 * @typedef {Object} SidoClickDetail
 * @property {string} id path의 id (예: 서울특별시)
 * @property {string} name 표시용 이름 (`id`와 동일)
 * @property {number} index 도형 순번 (0~16)
 * @property {MouseEvent} nativeEvent 원본 클릭 이벤트
 */

/** 17개 시도 호버 시 파스텔 (서로 다른 톤) */
const PASTEL_HOVER_FILLS = [
  '#ffd6e8',
  '#ffe4cc',
  '#fff9c2',
  '#d4f5d4',
  '#c8f0e8',
  '#cce5ff',
  '#e4d4ff',
  '#ffd4f0',
  '#d9efff',
  '#f5e6d3',
  '#e0d7ff',
  '#d5f5ea',
  '#ffe0ec',
  '#dde9ff',
  '#f2ebd9',
  '#e8e0ff',
  '#d4f0ff',
]

/**
 * SVG를 인라인으로 넣어 path마다 mouseenter/leave 시 스타일 전환
 * (background-image로는 시도별 호버 불가)
 *
 * @param {{ className?: string, onSidoClick?: (detail: SidoClickDetail) => void }} props
 */
export default function KoreaSidoMapInteractive({ className, onSidoClick }) {
  const wrapRef = useRef(null)
  const onSidoClickRef = useRef(onSidoClick)
  onSidoClickRef.current = onSidoClick

  useLayoutEffect(() => {
    const root = wrapRef.current
    if (!root) return

    const html = sidoSvgRaw.replace(/^\s*<\?xml[^>]*\?>\s*/i, '')
    root.innerHTML = html

    const svg = root.querySelector('svg')
    if (!svg) return

    const paths = svg.querySelectorAll('path')
    const disposers = []

    const svgNS = 'http://www.w3.org/2000/svg'

    paths.forEach((path, i) => {
      const sidoName =
        path.id?.trim() ||
        path.getAttribute('id')?.trim() ||
        `시도 ${i + 1}`

      const tip = document.createElementNS(svgNS, 'title')
      tip.textContent = sidoName
      path.insertBefore(tip, path.firstChild)

      const hoverFill = PASTEL_HOVER_FILLS[i % PASTEL_HOVER_FILLS.length]
      path.style.transition =
        'fill 0.38s ease, stroke-width 0.32s ease, filter 0.35s ease, fill-opacity 0.32s ease'
      path.style.cursor = 'pointer'

      const onEnter = () => {
        path.style.fill = hoverFill
        path.style.fillOpacity = '0.98'
        path.style.strokeWidth = '2.35'
        path.style.filter =
          'drop-shadow(0 3px 8px rgba(30, 58, 95, 0.2))'
      }
      const onLeave = () => {
        path.style.fill = ''
        path.style.fillOpacity = ''
        path.style.strokeWidth = ''
        path.style.filter = ''
      }

      const onClick = (nativeEvent) => {
        const id = path.id || path.getAttribute('id') || ''
        onSidoClickRef.current?.({
          id,
          name: id,
          index: i,
          nativeEvent,
        })
      }

      path.addEventListener('mouseenter', onEnter)
      path.addEventListener('mouseleave', onLeave)
      path.addEventListener('click', onClick)
      disposers.push(() => {
        path.removeEventListener('mouseenter', onEnter)
        path.removeEventListener('mouseleave', onLeave)
        path.removeEventListener('click', onClick)
      })
    })

    return () => {
      disposers.forEach((d) => d())
      root.innerHTML = ''
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className={[styles.wrap, className].filter(Boolean).join(' ')}
    />
  )
}
