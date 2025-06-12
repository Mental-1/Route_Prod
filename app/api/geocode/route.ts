import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const geocodeSchema = z.object({
  address: z.string().min(1),
})

const reverseGeocodeSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address } = geocodeSchema.parse(body)

    const supabase = createClient()

    // First check cache
    const { data: cached } = await supabase.from("geocoded_locations").select("*").eq("address", address).single()

    if (cached) {
      return NextResponse.json({
        latitude: cached.latitude,
        longitude: cached.longitude,
        formatted_address: cached.formatted_address,
        city: cached.city,
        state: cached.state,
        country: cached.country,
        postal_code: cached.postal_code,
        cached: true,
      })
    }

    // Use external geocoding service (Google Maps, Mapbox, etc.)
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=1`

    const response = await fetch(geocodeUrl)
    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    const feature = data.features[0]
    const [longitude, latitude] = feature.center
    const formattedAddress = feature.place_name

    // Extract address components
    const context = feature.context || []
    let city = null
    let state = null
    let country = null
    let postalCode = null

    context.forEach((component: any) => {
      if (component.id.startsWith("place")) city = component.text
      if (component.id.startsWith("region")) state = component.text
      if (component.id.startsWith("country")) country = component.text
      if (component.id.startsWith("postcode")) postalCode = component.text
    })

    // Cache the result
    await supabase.from("geocoded_locations").insert({
      address,
      formatted_address: formattedAddress,
      latitude,
      longitude,
      city,
      state,
      country,
      postal_code: postalCode,
      geometry: `POINT(${longitude} ${latitude})`,
    })

    return NextResponse.json({
      latitude,
      longitude,
      formatted_address: formattedAddress,
      city,
      state,
      country,
      postal_code: postalCode,
      cached: false,
    })
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = Number.parseFloat(searchParams.get("lat") || "")
    const lng = Number.parseFloat(searchParams.get("lng") || "")

    const { lat: latitude, lng: longitude } = reverseGeocodeSchema.parse({ lat, lng })

    const supabase = createClient()

    // Check for nearby cached results
    const { data: cached } = await supabase.rpc("reverse_geocode", {
      lat: latitude,
      lng: longitude,
    })

    if (cached && cached.length > 0) {
      return NextResponse.json(cached[0])
    }

    // Use external reverse geocoding service
    const reverseUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=1`

    const response = await fetch(reverseUrl)
    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    const feature = data.features[0]
    const formattedAddress = feature.place_name

    return NextResponse.json({
      formatted_address: formattedAddress,
      city: null,
      state: null,
      country: null,
      postal_code: null,
    })
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    return NextResponse.json({ error: "Reverse geocoding failed" }, { status: 500 })
  }
}
