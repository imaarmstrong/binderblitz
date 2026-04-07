import { H3Event, createError, sendError } from 'h3'
import { getDb } from '../../utils/mongo'

export default async function (event: H3Event) {
  try {
    const db = await getDb()
    // Simple ping command to ensure the connection is alive
    await db.command({ ping: 1 })

    return {
      ok: true,
      message: 'Database connection successful',
    }
  } catch (err: any) {
    return sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Database connection failed',
        data: { message: err?.message ?? 'Unknown error' },
      })
    )
  }
}
