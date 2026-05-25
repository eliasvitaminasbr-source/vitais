import { supabase } from './supabase'
import * as FileSystem from 'expo-file-system'

const BUCKET = 'rh-documents'

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn)
  if (error) return null
  return data.signedUrl
}

export async function uploadAtestado(
  colaboradorId: number,
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  const path = `${colaboradorId}/atestados/${Date.now()}_${fileName}`

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const contentType = mimeType || 'application/octet-stream'
  const arrayBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType, upsert: false })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  return path
}
