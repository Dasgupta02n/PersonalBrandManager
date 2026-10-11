/** Liveness check for the container and uptime monitoring. Reveals nothing about configuration. */
export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
