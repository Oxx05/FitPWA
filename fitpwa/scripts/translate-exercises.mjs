import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import translate from '@vitalets/google-translate-api'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const BATCH_SIZE = 25
const DELAY_MS = 2000

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const fetchBatch = async (offset) => {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, name_pt')
    .order('id', { ascending: true })
    .range(offset, offset + BATCH_SIZE - 1)

  if (error) throw error
  return (data || []).filter(row => row.name && row.name_pt === row.name)
}

const updateTranslation = async (id, namePt) => {
  const { error } = await supabase
    .from('exercises')
    .update({ name_pt: namePt })
    .eq('id', id)
  if (error) throw error
}

const run = async () => {
  console.log('Starting translation job (en -> pt)...')

  let offset = 0
  let processed = 0
  let translated = 0

  while (true) {
    const rows = await fetchBatch(offset)
    if (rows.length === 0) break

    for (const row of rows) {
      processed += 1
      const source = row.name || ''
      if (!source) continue

      try {
        const result = await translate(source, { from: 'en', to: 'pt' })
        const translatedText = result?.text?.trim()
        if (translatedText) {
          await updateTranslation(row.id, translatedText)
          translated += 1
          console.log(`Translated ${translated}/${processed}: ${source} -> ${translatedText}`)
        } else {
          console.log(`Skipped ${row.id}: empty translation`)
        }
      } catch (err) {
        console.error(`Failed ${row.id}:`, err?.message || err)
      }

      await sleep(DELAY_MS)
    }

    if (rows.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  console.log(`Done. Processed ${processed}, translated ${translated}.`)
}

run().catch(err => {
  console.error('Translation job failed:', err?.message || err)
  process.exit(1)
})
