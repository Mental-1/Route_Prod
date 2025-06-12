"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface UploadResult {
  url: string
  filename: string
  size: number
  type: string
}

interface UseFileUploadOptions {
  maxFiles?: number
  maxSize?: number
  allowedTypes?: string[]
  uploadType: "listing" | "profile"
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const uploadFile = async (file: File): Promise<UploadResult | null> => {
    try {
      setUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", options.uploadType)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const result = await response.json()
      setUploadProgress(100)

      toast({
        title: "Upload successful",
        description: "File uploaded successfully",
      })

      return result
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
      return null
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const uploadFiles = async (files: File[]): Promise<UploadResult[]> => {
    const results: UploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await uploadFile(file)
      if (result) {
        results.push(result)
      }
      setUploadProgress(((i + 1) / files.length) * 100)
    }

    return results
  }

  const deleteFile = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/upload/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      toast({
        title: "File deleted",
        description: "File deleted successfully",
      })

      return true
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete file",
        variant: "destructive",
      })
      return false
    }
  }

  return {
    uploadFile,
    uploadFiles,
    deleteFile,
    uploading,
    uploadProgress,
  }
}
