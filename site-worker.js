import { getAssetFromKV, serveSinglePageApp } from "@cloudflare/kv-asset-handler";

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false;

addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  let options = {};

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      };
    }

    // simple merkle tree lookup API using cloudlare KV https://blog.cloudflare.com/workers-kv-is-ga/
    if (event.request.url && event.request.url.indexOf("/merklelookup") >= 0) {
      const queryParams = new URL(event.request.url).searchParams;
      const addressParam = queryParams.get("address");
      const merkleValue = await MERKLE.get(addressParam);
      if (!merkleValue) {
        return new Response('{"error": "Address not found", "missing": true }', { status: 200 });
      }
      return new Response(merkleValue, { status: 200 });
    }

    const page = await getAssetFromKV(event, {
      mapRequestToAsset: serveSinglePageApp,
    });

    // allow headers to be altered
    const response = new Response(page.body, page);

    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "unsafe-url");
    response.headers.set("Feature-Policy", "none");

    return response;
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: (req) => new Request(`${new URL(req.url).origin}/404.html`, req),
        });

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404,
        });
      } catch (e) {
        console.error(e);
      }
    }

    return new Response(e.message || e.toString(), { status: 500 });
  }
}
