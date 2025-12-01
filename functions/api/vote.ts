export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const body = await request.json()
    const option = String(body.option ?? '')

    if (!option) return new Response("invalid", { status: 400 })

    const key = `vote::${option}`
    const prev = await env.VOTES_KV.get(key)
    const count = prev ? Number(prev) : 0
    const next = count + 1

    await env.VOTES_KV.put(key, String(next))

    return new Response(JSON.stringify({ ok: true, option, count: next }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (err) {
    return new Response("error", { status: 500 })
  }
}
