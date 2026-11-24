// Local PostgreSQL only. Creates and drops an isolated test database; never reads .env files.
import { spawn, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const connection = process.env.OFFER_TEST_DATABASE_URL
if (!connection) throw new Error('Set OFFER_TEST_DATABASE_URL to a local PostgreSQL maintenance database.')
const parsed = new URL(connection)
if (!['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) throw new Error('Offer DB tests only allow localhost.')
const psql = process.env.PSQL_BIN || 'psql'
const database = `ar_offer_tests_${randomUUID().replaceAll('-', '')}`
const testUrl = new URL(parsed); testUrl.pathname = `/${database}`
const root = fileURLToPath(new URL('../', import.meta.url))
const run = (url, args) => {
  const r = spawnSync(psql, ['-X', '--dbname', url, '-v', 'ON_ERROR_STOP=1', ...args], { cwd: root, encoding: 'utf8' })
  if (r.status !== 0) throw new Error(r.stderr || 'Local PostgreSQL command failed')
  return r.stdout
}
const asyncQuery = sql => new Promise(resolve => {
  const child = spawn(psql, ['-X', '--dbname', testUrl.href, '-v', 'ON_ERROR_STOP=1', '-c', sql], { cwd: root })
  let error = ''; child.stdout.resume(); child.stderr.on('data', chunk => { error += chunk })
  child.on('close', code => resolve({ code, error }))
  child.on('error', error => resolve({ code: -1, error: error.message }))
})
const customer = email => JSON.stringify({ email, fullName: 'Offer test', phone: '+971501234567', emirate: 'Dubai', area: 'Test', street: 'Test', building: 'Test', paymentMethod: 'card' })
const items = JSON.stringify([{ variant_id: '01581467-7bb3-4717-96d4-298132d8a06d', quantity: 1 }])
const checkout = (key, slug, email) => `SELECT public.place_store_order('${key}','${customer(email)}','${items}',NULL,NULL,'${slug}');`
try {
  run(parsed.href, ['-c', `CREATE DATABASE "${database}"`])
  run(testUrl.href, ['-f', 'tests/fixtures/offers-schema.sql', '-f', 'supabase/migrations/20261111_payment_concurrency.sql', '-f', 'supabase/migrations/20261120085420_offer_campaigns.sql', '-f', 'supabase/migrations/20261124041120_editable_offer_links.sql', '-f', 'supabase/tests/offer_campaigns.sql'])
  console.log('Migration and transaction/permissions/partial-return assertions passed.')
  run(testUrl.href, ['-c', "INSERT INTO public.offers(slug,title,status,discount_type,discount_value,usage_limit) VALUES('race-test','Race test','published','percentage',10,1),('retry-test','Retry test','published','percentage',10,1)"])
  const first = asyncQuery(`BEGIN; ${checkout(randomUUID(), 'race-test', 'race-one@example.test')} SELECT pg_sleep(1); COMMIT;`)
  const second = asyncQuery(checkout(randomUUID(), 'race-test', 'race-two@example.test'))
  const race = await Promise.all([first, second])
  if (race.filter(r => r.code === 0).length !== 1 || !race.some(r => r.error.includes('usage limit'))) throw new Error('Concurrent usage-limit assertion failed')
  const key = randomUUID()
  const retries = await Promise.all([asyncQuery(checkout(key, 'retry-test', 'retry@example.test')), asyncQuery(checkout(key, 'retry-test', 'retry@example.test'))])
  if (retries.some(r => r.code !== 0)) throw new Error('Concurrent retry assertion failed')
  const count = run(testUrl.href, ['-At', '-c', `SELECT count(*) FROM orders WHERE checkout_key='${key}'`]).trim()
  if (count !== '1') throw new Error('Concurrent retries duplicated an order')
  console.log('Concurrent final-redemption race and simultaneous idempotent retries passed.')
} finally {
  run(parsed.href, ['-c', `DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`])
}
