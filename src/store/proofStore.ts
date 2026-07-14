import { del, get, set } from 'idb-keyval'
import { uid } from '../lib/dates'

/** Beweisfotos landen in IndexedDB (localStorage wäre zu klein). */

export async function savePhoto(file: File): Promise<string> {
  const id = uid('photo')
  const dataUrl = await downscale(file, 1280, 0.8)
  await set(id, dataUrl)
  return id
}

export async function loadPhoto(id: string): Promise<string | undefined> {
  return get<string>(id)
}

export async function deletePhoto(id: string): Promise<void> {
  return del(id)
}

function downscale(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Bild konnte nicht gelesen werden'))
    }
    img.src = url
  })
}
