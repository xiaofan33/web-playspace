export function splitImage(
  imgDataUrl: string,
  columns: number,
  rows: number,
  opts?: {
    imgType?: string
    quality?: number
  },
) {
  return new Promise<string[]>((resolve, reject) => {
    const img = new Image()
    img.src = imgDataUrl
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const w = Math.floor(img.width / columns)
      const h = Math.floor(img.height / rows)
      canvas.width = w
      canvas.height = h
      resolve(
        Array.from({ length: w * h }, (_, index) => {
          const x = index % columns
          const y = Math.floor(index / columns)
          ctx?.drawImage(img, x * w, y * h, w, h, 0, 0, w, h)
          return canvas.toDataURL(opts?.imgType, opts?.quality)
        }),
      )
    }
    img.onerror = e => {
      const msg = e instanceof Event ? e.type : e
      reject(new Error(`image load error: ${msg}`))
    }
  })
}
