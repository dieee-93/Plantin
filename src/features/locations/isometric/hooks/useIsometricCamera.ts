import { useState, useCallback, useRef, useEffect } from 'react'

export interface CameraState {
  x: number
  y: number
  zoom: number
}

export interface UseIsometricCameraOptions {
  initialZoom?: number
  minZoom?: number
  maxZoom?: number
  zoomStep?: number
  restingLimitX?: number
  restingLimitY?: number
  hardLimitX?: number
  hardLimitY?: number
}

export function useIsometricCamera(options: UseIsometricCameraOptions = {}) {
  const {
    initialZoom = 1,
    minZoom = 0.6,
    maxZoom = 2.0,
    zoomStep = 0.15,
    restingLimitX = 220,
    restingLimitY = 160,
    hardLimitX = 420,
    hardLimitY = 300,
  } = options

  const [camera, setCamera] = useState<CameraState>({
    x: 0,
    y: 0,
    zoom: initialZoom,
  })

  const cameraRef = useRef(camera)
  cameraRef.current = camera

  const isPanningRef = useRef(false)
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const springRafRef = useRef<number | null>(null)

  const stopSpringAnimation = useCallback(() => {
    if (springRafRef.current !== null) {
      cancelAnimationFrame(springRafRef.current)
      springRafRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopSpringAnimation()
  }, [stopSpringAnimation])

  /**
   * Anima suavemente la cámara a una posición (targetX, targetY, targetZoom)
   * usando interpolación exponencial con amortiguación natural.
   */
  const animateTo = useCallback((targetX: number, targetY: number, targetZoom?: number) => {
    stopSpringAnimation()

    const step = () => {
      const cur = cameraRef.current
      const tz = targetZoom ?? cur.zoom
      const dx = targetX - cur.x
      const dy = targetY - cur.y
      const dz = tz - cur.zoom

      if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6 && Math.abs(dz) < 0.01) {
        setCamera({ x: targetX, y: targetY, zoom: Number(tz.toFixed(2)) })
        springRafRef.current = null
        return
      }

      setCamera({
        x: cur.x + dx * 0.18,
        y: cur.y + dy * 0.18,
        zoom: Number((cur.zoom + dz * 0.18).toFixed(3)),
      })

      springRafRef.current = requestAnimationFrame(step)
    }

    springRafRef.current = requestAnimationFrame(step)
  }, [stopSpringAnimation])

  const zoomIn = useCallback(() => {
    setCamera(prev => ({
      ...prev,
      zoom: Math.min(maxZoom, Number((prev.zoom + zoomStep).toFixed(2))),
    }))
  }, [maxZoom, zoomStep])

  const zoomOut = useCallback(() => {
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(minZoom, Number((prev.zoom - zoomStep).toFixed(2))),
    }))
  }, [minZoom, zoomStep])

  const setZoom = useCallback((newZoomOrFn: number | ((prev: number) => number)) => {
    setCamera(prev => {
      const nextZoom = typeof newZoomOrFn === 'function' ? newZoomOrFn(prev.zoom) : newZoomOrFn
      const clamped = Math.max(minZoom, Math.min(maxZoom, Number(nextZoom.toFixed(2))))
      return { ...prev, zoom: clamped }
    })
  }, [minZoom, maxZoom])

  const resetCamera = useCallback(() => {
    animateTo(0, 0, 1)
  }, [animateTo])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return
    const target = e.target as HTMLElement | SVGElement
    if (target.closest('button') || target.closest('[data-interactive="true"]')) return

    stopSpringAnimation()
    isPanningRef.current = true
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
  }, [stopSpringAnimation])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return
    const dx = e.clientX - lastPointerPosRef.current.x
    const dy = e.clientY - lastPointerPosRef.current.y
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY }

    setCamera(prev => {
      // Resistencia elástica progresiva si supera los límites cómodos de reposo
      const overX = Math.max(0, Math.abs(prev.x) - restingLimitX)
      const factorX = overX > 0 ? Math.max(0.18, 1 - overX / (hardLimitX - restingLimitX)) : 1

      const overY = Math.max(0, Math.abs(prev.y) - restingLimitY)
      const factorY = overY > 0 ? Math.max(0.18, 1 - overY / (hardLimitY - restingLimitY)) : 1

      const nextX = prev.x + (dx / prev.zoom) * factorX
      const nextY = prev.y + (dy / prev.zoom) * factorY

      return {
        ...prev,
        x: Math.max(-hardLimitX, Math.min(hardLimitX, nextX)),
        y: Math.max(-hardLimitY, Math.min(hardLimitY, nextY)),
      }
    })
  }, [restingLimitX, restingLimitY, hardLimitX, hardLimitY])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {}

      // Mecanismo de rebote elástico suave (rubber-band spring return)
      const cur = cameraRef.current
      const isOutsideX = Math.abs(cur.x) > restingLimitX
      const isOutsideY = Math.abs(cur.y) > restingLimitY

      if (isOutsideX || isOutsideY) {
        const targetX = Math.max(-restingLimitX, Math.min(restingLimitX, cur.x))
        const targetY = Math.max(-restingLimitY, Math.min(restingLimitY, cur.y))
        animateTo(targetX, targetY)
      }
    }
  }, [restingLimitX, restingLimitY, animateTo])

  const handleWheel = useCallback((e: React.WheelEvent | WheelEvent) => {
    const delta = e.deltaY < 0 ? zoomStep : -zoomStep
    setCamera(prev => {
      const nextZoom = Math.max(minZoom, Math.min(maxZoom, Number((prev.zoom + delta).toFixed(2))))
      return { ...prev, zoom: nextZoom }
    })
  }, [minZoom, maxZoom, zoomStep])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement | SVGElement
    if (target.closest('button') || target.closest('[data-interactive="true"]')) return
    // Recentrado suave inmediato al hacer doble clic en el fondo
    animateTo(0, 0, 1)
  }, [animateTo])

  return {
    camera,
    zoomIn,
    zoomOut,
    setZoom,
    resetCamera,
    animateTo,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleDoubleClick,
  }
}
