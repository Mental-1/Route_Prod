"use client"

import { useState, useCallback } from "react"

interface GeolocationState {
  loading: boolean
  accuracy?: number
  altitude?: number | null
  altitudeAccuracy?: number | null
  heading?: number | null
  latitude?: number
  longitude?: number
  speed?: number | null
  timestamp?: number
}

interface GeolocationError {
  code: number
  message: string
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
  })
  const [error, setError] = useState<GeolocationError | null>(null)

  const getCurrentPosition = useCallback((options?: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = {
          code: 0,
          message: "Geolocation is not supported by this browser",
        }
        setError(error)
        reject(error)
        return
      }

      setState((prev) => ({ ...prev, loading: true }))
      setError(null)

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 600000,
        ...options,
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            loading: false,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          })
          resolve(position)
        },
        (error) => {
          let errorMessage = "Unknown error acquiring position"

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user"
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable"
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out"
              break
          }

          const geolocationError = {
            code: error.code,
            message: errorMessage,
          }

          setState((prev) => ({ ...prev, loading: false }))
          setError(geolocationError)
          reject(geolocationError)
        },
        defaultOptions,
      )
    })
  }, [])

  return {
    ...state,
    error,
    getCurrentPosition,
  }
}
