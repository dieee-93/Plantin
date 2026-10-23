import { useState, useCallback, useRef } from 'react'

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
}

export function useIsometricCamera(options: UseIsometricCameraOptions = {}) {
  const {
    initialZoom = 1,
    minZoom = 0.6,
    maxZoom = 2.0,
    zoomStep = 0.15,
  } = options

  const [camera, setCamera] = useState<CameraState>({
    x: 0,
    y: 0,
    zoom: initialZoom,
  })

  const isPanningRef = useRef(false)
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

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
    setCamera({ x: 0, y: 0, zoom: 1 })
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Solo iniciar paneo con clic izquierdo o botón del medio, si no viene de un botón interactivo
    if (e.button !== 0 && e.button !== 1) return
    const target = e.target as HTMLElement | SVGElement
    // Si se hizo click en un botón, slot o elemento interactivo, no panear
    if (target.closest('button') || target.closest('[data-interactive="true"]')) return

    isPanningRef.current = true
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return
    const dx = e.clientX - lastPointerPosRef.current.x
    const dy = e.clientY - lastPointerPosRef.current.y
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY }

    setCamera(prev => ({
      ...prev,
      x: prev.x + dx / prev.zoom,
      y: prev.y + dy / prev.zoom,
    }))
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {}
    }
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Zoom con rueda centrado
    const delta = e.deltaY < 0 ? zoomStep : -zoomStep
    setCamera(prev => {
      const nextZoom = Math.max(minZoom, Math.min(maxZoom, Number((prev.zoom + delta).toFixed(2))))
      return { ...prev, zoom: nextZoom }
    })
  }, [minZoom, maxZoom, zoomStep])

  return {
    camera,
    zoomIn,
    zoomOut,
    setZoom,
    resetCamera,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  }
}
