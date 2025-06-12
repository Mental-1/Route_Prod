"use client"

import type React from "react"

import { useState } from "react"
import { Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFileUpload } from "@/hooks/use-file-upload"
import { cn } from "@/lib/utils"

interface ProfileImageUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export function ProfileImageUpload({ value, onChange, className, size = "md" }: ProfileImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const { uploadFile, deleteFile, uploading } = useFileUpload({
    uploadType: "profile",
    maxFiles: 1,
  })

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return
    }

    // Delete old image if exists
    if (value) {
      await deleteFile(value)
    }

    const result = await uploadFile(file)
    if (result) {
      onChange(result.url)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative group cursor-pointer",
          sizeClasses[size],
          dragActive && "ring-2 ring-primary ring-offset-2",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Avatar className={cn("w-full h-full", uploading && "opacity-50")}>
          <AvatarImage src={value || "/placeholder.svg"} />
          <AvatarFallback>
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
          <Camera className="h-6 w-6 text-white" />
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleFileSelect(file)
            }
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={uploading}
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
        disabled={uploading}
        onClick={(e) => {
          e.stopPropagation()
          const input = document.createElement("input")
          input.type = "file"
          input.accept = "image/*"
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
              handleFileSelect(file)
            }
          }
          input.click()
        }}
      >
        <Camera className="h-4 w-4" />
      </Button>
    </div>
  )
}
