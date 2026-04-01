// artistlog.ai — Cloudflare Worker
import {
  ArtworkPortfolio,
  GalleryCurator,
  StudioJournal,
  ExhibitionTracker,
  CommissionManager,
  type Artwork,
  type Gallery,
  type JournalEntry,
  type Exhibition,
  type Commission,
} from "./art/tracker";

export interface Env {
  DEEPSEEK_API_KEY: string;
}

const portfolio = new ArtworkPortfolio();
const curator = new GalleryCurator();
const journal = new StudioJournal();
const exhibitions = new ExhibitionTracker();
const commissions = new CommissionManager();

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function error(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  const { message } = (await request.json()) as { message: string };
  if (!message) return error("message is required");

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));

      try {
        const resp = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content:
                  "You are a creative assistant for artists. Help with artistic technique, portfolio curation, exhibition planning, and creative process. Be inspiring and knowledgeable about art history, materials, and the business of art.",
              },
              { role: "user", content: message },
            ],
            stream: true,
          }),
        });

        if (!resp.ok || !resp.body) {
          send(JSON.stringify({ error: "DeepSeek API error" }));
          controller.close();
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") {
              send("[DONE]");
              continue;
            }
            try {
              const parsed = JSON.parse(payload);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) send(JSON.stringify({ content }));
            } catch {
              /* skip malformed chunks */
            }
          }
        }
      } catch (err) {
        send(JSON.stringify({ error: String(err) }));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function handleArtworks(request: Request): Promise<Response> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as Artwork["status"] | null;
    const tag = url.searchParams.get("tag");
    const q = url.searchParams.get("q");
    if (q) return json(portfolio.search(q));
    return json(portfolio.list(status ? { status } : tag ? { tag } : undefined));
  }

  const body = (await request.json()) as Partial<Artwork>;
  if (!body.title || !body.medium) return error("title and medium are required");
  const artwork = portfolio.add({
    title: body.title,
    medium: body.medium,
    dimensions: body.dimensions || "",
    imageRefs: body.imageRefs || [],
    price: body.price ?? null,
    year: body.year || new Date().getFullYear(),
    status: body.status || "in_progress",
    tags: body.tags || [],
  });
  return json(artwork, 201);
}

async function handleGallery(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.replace("/api/gallery", "").split("/").filter(Boolean);

  if (request.method === "GET") {
    if (pathParts.length === 1) {
      const gallery = curator.get(pathParts[0]);
      if (!gallery) return error("Gallery not found", 404);
      return json(gallery);
    }
    return json(curator.list());
  }

  if (request.method === "POST") {
    const body = (await request.json()) as Partial<Gallery>;
    if (!body.name) return error("name is required");
    const gallery = curator.create({
      name: body.name,
      description: body.description || "",
      artworkIds: body.artworkIds || [],
      curated: body.curated ?? true,
    });
    return json(gallery, 201);
  }

  return error("Method not allowed", 405);
}

async function handleJournal(request: Request): Promise<Response> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const mood = url.searchParams.get("mood") as JournalEntry["mood"] | null;
    const artworkId = url.searchParams.get("artworkId");
    return json(journal.list(mood ? { mood } : artworkId ? { artworkId } : undefined));
  }

  const body = (await request.json()) as Partial<JournalEntry>;
  if (!body.title || !body.body) return error("title and body are required");
  const entry = journal.add({
    date: body.date || new Date().toISOString().slice(0, 10),
    title: body.title,
    body: body.body,
    mood: body.mood || "reflective",
    artworkId: body.artworkId || null,
    tags: body.tags || [],
  });
  return json(entry, 201);
}

async function handleExhibitions(request: Request): Promise<Response> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as Exhibition["status"] | null;
    if (status === "upcoming") return json(exhibitions.upcoming());
    if (status === "current") return json(exhibitions.current());
    return json(exhibitions.list(status ? { status } : undefined));
  }

  const body = (await request.json()) as Partial<Exhibition>;
  if (!body.title || !body.venue) return error("title and venue are required");
  const exhibition = exhibitions.add({
    title: body.title,
    venue: body.venue,
    startDate: body.startDate || "",
    endDate: body.endDate || "",
    artworkIds: body.artworkIds || [],
    status: body.status || "upcoming",
    description: body.description || "",
  });
  return json(exhibition, 201);
}

async function handleCommissions(request: Request): Promise<Response> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as Commission["status"] | null;
    return json(commissions.list(status ? { status } : undefined));
  }

  const body = (await request.json()) as Partial<Commission>;
  if (!body.clientName || !body.title) return error("clientName and title are required");
  const commission = commissions.add({
    clientName: body.clientName,
    clientEmail: body.clientEmail || "",
    title: body.title,
    description: body.description || "",
    medium: body.medium || "",
    budget: body.budget || 0,
    deadline: body.deadline || "",
    status: body.status || "inquiry",
    progress: body.progress || 0,
    notes: body.notes || [],
  });
  return json(commission, 201);
}

async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (pathname === "/api/chat" && request.method === "POST") return handleChat(request, env);
  if (pathname.startsWith("/api/artworks")) return handleArtworks(request);
  if (pathname.startsWith("/api/gallery")) return handleGallery(request);
  if (pathname.startsWith("/api/studio/journal")) return handleJournal(request);
  if (pathname.startsWith("/api/exhibitions")) return handleExhibitions(request);
  if (pathname.startsWith("/api/commissions")) return handleCommissions(request);

  // Serve static HTML for root
  if (pathname === "/" || pathname === "/app.html") {
    const html = await env.ASSETS?.fetch(new Request(new URL("/app.html", url.origin)));
    if (html) return html;
    // Fallback: try fetching from KV or return a redirect
    return Response.redirect(new URL("/app.html", url.origin).toString(), 302);
  }

  return error("Not found", 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router(request, env);
  },
};
