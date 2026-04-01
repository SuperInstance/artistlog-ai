// artistlog.ai — Art Portfolio & Creative Process Tracker
// Domain models for managing artworks, galleries, studio journal, exhibitions, and commissions.

export interface Artwork {
  id: string;
  title: string;
  medium: string;
  dimensions: string;
  imageRefs: string[];
  price: number | null;
  year: number;
  status: "available" | "sold" | "in_progress" | "archived";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Gallery {
  id: string;
  name: string;
  description: string;
  artworkIds: string[];
  curated: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: "inspired" | "frustrated" | "reflective" | "excited" | "calm";
  artworkId: string | null;
  tags: string[];
  createdAt: string;
}

export interface Exhibition {
  id: string;
  title: string;
  venue: string;
  startDate: string;
  endDate: string;
  artworkIds: string[];
  status: "upcoming" | "current" | "past";
  description: string;
}

export interface Commission {
  id: string;
  clientName: string;
  clientEmail: string;
  title: string;
  description: string;
  medium: string;
  budget: number;
  deadline: string;
  status: "inquiry" | "accepted" | "in_progress" | "review" | "completed" | "cancelled";
  progress: number;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function ts(): string {
  return new Date().toISOString();
}

export class ArtworkPortfolio {
  private artworks: Map<string, Artwork> = new Map();

  add(data: Omit<Artwork, "id" | "createdAt" | "updatedAt">): Artwork {
    const artwork: Artwork = {
      ...data,
      id: uid(),
      createdAt: ts(),
      updatedAt: ts(),
    };
    this.artworks.set(artwork.id, artwork);
    return artwork;
  }

  get(id: string): Artwork | undefined {
    return this.artworks.get(id);
  }

  list(filter?: { status?: Artwork["status"]; tag?: string }): Artwork[] {
    let results = [...this.artworks.values()];
    if (filter?.status) results = results.filter((a) => a.status === filter.status);
    if (filter?.tag) results = results.filter((a) => a.tags.includes(filter.tag!));
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  update(id: string, data: Partial<Omit<Artwork, "id" | "createdAt">>): Artwork | null {
    const existing = this.artworks.get(id);
    if (!existing) return null;
    const updated: Artwork = { ...existing, ...data, updatedAt: ts() };
    this.artworks.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.artworks.delete(id);
  }

  search(query: string): Artwork[] {
    const q = query.toLowerCase();
    return [...this.artworks.values()].filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.medium.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
}

export class GalleryCurator {
  private galleries: Map<string, Gallery> = new Map();

  create(data: Omit<Gallery, "id" | "createdAt">): Gallery {
    const gallery: Gallery = { ...data, id: uid(), createdAt: ts() };
    this.galleries.set(gallery.id, gallery);
    return gallery;
  }

  get(id: string): Gallery | undefined {
    return this.galleries.get(id);
  }

  list(): Gallery[] {
    return [...this.galleries.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addArtwork(galleryId: string, artworkId: string): Gallery | null {
    const gallery = this.galleries.get(galleryId);
    if (!gallery) return null;
    if (!gallery.artworkIds.includes(artworkId)) {
      gallery.artworkIds.push(artworkId);
    }
    return gallery;
  }

  removeArtwork(galleryId: string, artworkId: string): Gallery | null {
    const gallery = this.galleries.get(galleryId);
    if (!gallery) return null;
    gallery.artworkIds = gallery.artworkIds.filter((id) => id !== artworkId);
    return gallery;
  }

  remove(id: string): boolean {
    return this.galleries.delete(id);
  }
}

export class StudioJournal {
  private entries: Map<string, JournalEntry> = new Map();

  add(data: Omit<JournalEntry, "id" | "createdAt">): JournalEntry {
    const entry: JournalEntry = { ...data, id: uid(), createdAt: ts() };
    this.entries.set(entry.id, entry);
    return entry;
  }

  get(id: string): JournalEntry | undefined {
    return this.entries.get(id);
  }

  list(filter?: { mood?: JournalEntry["mood"]; artworkId?: string }): JournalEntry[] {
    let results = [...this.entries.values()];
    if (filter?.mood) results = results.filter((e) => e.mood === filter.mood);
    if (filter?.artworkId) results = results.filter((e) => e.artworkId === filter.artworkId);
    return results.sort((a, b) => b.date.localeCompare(a.date));
  }

  update(id: string, data: Partial<Omit<JournalEntry, "id" | "createdAt">>): JournalEntry | null {
    const existing = this.entries.get(id);
    if (!existing) return null;
    const updated: JournalEntry = { ...existing, ...data };
    this.entries.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.entries.delete(id);
  }
}

export class ExhibitionTracker {
  private exhibitions: Map<string, Exhibition> = new Map();

  add(data: Omit<Exhibition, "id">): Exhibition {
    const exhibition: Exhibition = { ...data, id: uid() };
    this.exhibitions.set(exhibition.id, exhibition);
    return exhibition;
  }

  get(id: string): Exhibition | undefined {
    return this.exhibitions.get(id);
  }

  list(filter?: { status?: Exhibition["status"] }): Exhibition[] {
    let results = [...this.exhibitions.values()];
    if (filter?.status) results = results.filter((e) => e.status === filter.status);
    return results.sort((a, b) => b.startDate.localeCompare(a.startDate));
  }

  update(id: string, data: Partial<Omit<Exhibition, "id">>): Exhibition | null {
    const existing = this.exhibitions.get(id);
    if (!existing) return null;
    const updated: Exhibition = { ...existing, ...data };
    this.exhibitions.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.exhibitions.delete(id);
  }

  upcoming(): Exhibition[] {
    const now = new Date().toISOString().slice(0, 10);
    return [...this.exhibitions.values()]
      .filter((e) => e.startDate > now || e.status === "upcoming")
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  current(): Exhibition[] {
    return [...this.exhibitions.values()].filter((e) => e.status === "current");
  }
}

export class CommissionManager {
  private commissions: Map<string, Commission> = new Map();

  add(data: Omit<Commission, "id" | "createdAt" | "updatedAt">): Commission {
    const commission: Commission = {
      ...data,
      id: uid(),
      createdAt: ts(),
      updatedAt: ts(),
    };
    this.commissions.set(commission.id, commission);
    return commission;
  }

  get(id: string): Commission | undefined {
    return this.commissions.get(id);
  }

  list(filter?: { status?: Commission["status"] }): Commission[] {
    let results = [...this.commissions.values()];
    if (filter?.status) results = results.filter((c) => c.status === filter.status);
    return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  update(id: string, data: Partial<Omit<Commission, "id" | "createdAt">>): Commission | null {
    const existing = this.commissions.get(id);
    if (!existing) return null;
    const updated: Commission = { ...existing, ...data, updatedAt: ts() };
    this.commissions.set(id, updated);
    return updated;
  }

  addNote(id: string, note: string): Commission | null {
    const existing = this.commissions.get(id);
    if (!existing) return null;
    existing.notes.push(note);
    existing.updatedAt = ts();
    return existing;
  }

  remove(id: string): boolean {
    return this.commissions.delete(id);
  }

  active(): Commission[] {
    return this.list({ status: "in_progress" });
  }
}
