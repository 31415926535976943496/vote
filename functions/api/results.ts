export async function onRequestGet(context) {
  const { env } = context

  const a = await env.VOTES_KV.get("vote::A")
  const b = await env.VOTES_KV.get("vote::B")

  return new Response(JSON.stringify({
    A: Number(a ?? 0),
    B: Number(b ?? 0)
  }), {
    headers: { "Content-Type": "application/json" }
  })
}
