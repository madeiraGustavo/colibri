import { buildApp } from './app.js'
import { resolveListenPort } from './env.js'

async function start(): Promise<void> {
  const app = await buildApp()
  const port = resolveListenPort()

  try {
    await app.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
