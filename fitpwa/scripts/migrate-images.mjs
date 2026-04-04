import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const BUCKET = 'exercise_images'
const BATCH_SIZE = 25

const fetchExternalGif = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch gif (${res.status}) ${url}`)
  const arrayBuffer = await res.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

const uploadGif = async (id, bytes) => {
  const filePath = `${id}.gif`
  const { error } = await supabase
    .storage
    .from(BUCKET)
    .upload(filePath, bytes, { contentType: 'image/gif', upsert: true })
  if (error) throw error

  const { data } = supabase
    .storage
    .from(BUCKET)
    .getPublicUrl(filePath)

  return data?.publicUrl || null
}

const updateGifUrl = async (id, publicUrl) => {
  const { error } = await supabase
    .from('exercises')
    .update({ gif_url: publicUrl })
    .eq('id', id)
  if (error) throw error
}

const fetchBatch = async (offset) => {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, gif_url')
    .like('gif_url', 'http%')
    .order('id', { ascending: true })
    .range(offset, offset + BATCH_SIZE - 1)

  if (error) throw error
  return data || []
}

const run = async () => {
  console.log('Starting ExerciseDB image migration...')

  let offset = 0
  let processed = 0
  let updated = 0

  while (true) {
    const rows = await fetchBatch(offset)
    if (rows.length === 0) break

    for (const row of rows) {
      processed += 1
      if (!row.gif_url) continue

      try {
        const bytes = await fetchExternalGif(row.gif_url)
        const publicUrl = await uploadGif(row.id, bytes)
        if (publicUrl) {
          await updateGifUrl(row.id, publicUrl)
          updated += 1
          console.log(`Updated ${row.id} (${updated}/${processed})`)
        } else {
          console.log(`Skipped ${row.id} (no public URL)`)
        }
      } catch (err) {
        console.error(`Failed ${row.id}:`, err?.message || err)
      }
    }

    if (rows.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  console.log(`Done. Processed ${processed}, updated ${updated}.`)
}

run().catch(err => {
  console.error('Migration failed:', err?.message || err)
  process.exit(1)
})
