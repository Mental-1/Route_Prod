"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for Leaflet marker icons in Next.js
const markerIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const userIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface MapComponentProps {
  userLocation: [number, number]
  listings: {
    id: number
    title: string
    price: number
    lat: number
    lng: number
    distance: string
  }[]
  selectedListing: number | null
}

// Component to handle map view updates
function MapUpdater({
  userLocation,
  selectedListing,
  listings,
}: {
  userLocation: [number, number]
  selectedListing: number | null
  listings: MapComponentProps["listings"]
}) {
  const map = useMap()

  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, 14)
    }
  }, [map, userLocation[0], userLocation[1]]) // Only depend on actual coordinates

  useEffect(() => {
    if (selectedListing) {
      const listing = listings.find((l) => l.id === selectedListing)
      if (listing) {
        map.setView([listing.lat, listing.lng], 16, { animate: true })
      }
    }
  }, [selectedListing]) // Remove map and listings from dependencies

  return null
}

export default function MapComponent({ userLocation, listings, selectedListing }: MapComponentProps) {
  return (
    <MapContainer center={userLocation} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={true} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location marker */}
      <Marker position={userLocation} icon={userIcon}>
        <Popup>Your location</Popup>
      </Marker>

      {/* Listing markers */}
      {listings.map((listing) => (
        <Marker
          key={`listing-${listing.id}`}
          position={[listing.lat, listing.lng]}
          icon={markerIcon}
          opacity={selectedListing === null || selectedListing === listing.id ? 1 : 0.7}
          zIndexOffset={selectedListing === listing.id ? 1000 : 0}
        >
          <Popup>
            <div className="text-sm min-w-[150px]">
              <p className="font-medium mb-1">{listing.title}</p>
              <p className="font-bold text-green-600 mb-1">${listing.price}</p>
              <p className="text-gray-500 text-xs">{listing.distance}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      <MapUpdater userLocation={userLocation} selectedListing={selectedListing} listings={listings} />
    </MapContainer>
  )
}
