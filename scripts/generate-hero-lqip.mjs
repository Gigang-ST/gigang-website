import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const heroDir = path.join(process.cwd(), "public", "images", "hero")
const outputPath = path.join(process.cwd(), "lib", "hero-lqip.json")
const supportedExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"])

const toDataUrl = async (filePath) => {
  const buffer = await sharp(filePath)
    .resize(16, 16, { fit: "inside" })
    .removeAlpha()
    .jpeg({ quality: 45 })
    .toBuffer()

  return `data:image/jpeg;base64,${buffer.toString("base64")}`
}

const main = async () => {
  const entries = await fs.readdir(heroDir, { withFileTypes: true })
  const files = entries
    .filter((entry) => entry.isFile() && supportedExts.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  if (files.length === 0) {
    console.log("No hero images found.")
    return
  }

  const lqipMap = {}

  for (const filename of files) {
    const filePath = path.join(heroDir, filename)
    const webPath = `/images/hero/${filename}`
    lqipMap[webPath] = await toDataUrl(filePath)
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, `${JSON.stringify(lqipMap, null, 2)}\n`)
  console.log(`Updated ${outputPath} with ${files.length} entries.`)
}

main().catch((error) => {
  console.error("Failed to generate hero LQIP data:", error)
  process.exit(1)
})
