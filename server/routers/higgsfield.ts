/**
 * Higgsfield Router — Integration with Higgsfield MCP for Soul Cinema & Soul 2.0 characters
 * 
 * Provides:
 * - List available Soul Cinema & Soul 2.0 characters from Higgsfield
 * - Get character details with preview images
 * - Search and filter by category
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

interface HiggsFieldCharacter {
  id: string;
  name: string;
  type: "soul_2" | "soul_cinema" | string;
  status: string;
  thumbnail_url?: string;
  preview_url?: string;
  soul_id?: string;
  url?: string;
}

/**
 * Cache for Higgsfield characters (5 min TTL)
 */
let characterCache: { data: HiggsFieldCharacter[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch characters from Higgsfield MCP
 */
async function fetchHiggsFieldCharactersFromMCP(): Promise<HiggsFieldCharacter[]> {
  try {
    // Check cache first
    if (characterCache && Date.now() - characterCache.timestamp < CACHE_TTL) {
      console.log("[Higgsfield] Using cached characters");
      return characterCache.data;
    }

    // For now, return default characters
    // TODO: Integrate with Higgsfield MCP in backend service
    const characters = getDefaultCharacters();
    
    // Cache the results
    characterCache = { data: characters, timestamp: Date.now() };
    console.log(`[Higgsfield] Using ${characters.length} default characters`);
    return characters;
  } catch (error) {
    console.error("[Higgsfield] Error fetching characters:", error);
    return getDefaultCharacters();
  }
}

/**
 * Default Soul Cinema & Soul 2.0 characters for fallback
 */
function getDefaultCharacters(): HiggsFieldCharacter[] {
  return [
    // Soul 2.0 Characters (from Higgsfield)
    {
      id: "7eb29cb8-cb31-4f0c-9cac-0e6ffe9e047b",
      name: "Lively Temptress",
      type: "soul_2",
      status: "ready",
      soul_id: "7eb29cb8-cb31-4f0c-9cac-0e6ffe9e047b",
    },
    {
      id: "073e443a-2572-4b0d-b268-bac2e6dcd9f9",
      name: "Seductive Elegance Unveiled",
      type: "soul_2",
      status: "ready",
      soul_id: "073e443a-2572-4b0d-b268-bac2e6dcd9f9",
    },
    {
      id: "a8f46f74-fe43-4db1-a701-84d44a779ecd",
      name: "Crimson Court Champion",
      type: "soul_2",
      status: "ready",
      soul_id: "a8f46f74-fe43-4db1-a701-84d44a779ecd",
    },
    {
      id: "f4ff58cd-3738-4850-be52-6a47057fbae6",
      name: "Whispering Shadows",
      type: "soul_2",
      status: "ready",
      soul_id: "f4ff58cd-3738-4850-be52-6a47057fbae6",
    },
    {
      id: "7b872dc0-939e-4871-b077-572bb2a07e79",
      name: "Elegance in Celebration",
      type: "soul_2",
      status: "ready",
      soul_id: "7b872dc0-939e-4871-b077-572bb2a07e79",
    },
    {
      id: "9dacf995-a214-4f19-b958-97d989bd3dcd",
      name: "Midnight Velvet Elegance",
      type: "soul_2",
      status: "ready",
      soul_id: "9dacf995-a214-4f19-b958-97d989bd3dcd",
    },
    {
      id: "420446bb-b7e9-4761-b557-1969c93b8a6b",
      name: "Vitality in Motion",
      type: "soul_2",
      status: "ready",
      soul_id: "420446bb-b7e9-4761-b557-1969c93b8a6b",
    },
    {
      id: "e46d1929-bea5-4eed-aa4e-2ff0e87dc383",
      name: "Dynamic Duo Workout",
      type: "soul_2",
      status: "ready",
      soul_id: "e46d1929-bea5-4eed-aa4e-2ff0e87dc383",
    },
    {
      id: "ed52bf9b-f1c8-421e-9a2e-c418f01fc3b0",
      name: "Silken Shadow Elegance",
      type: "soul_2",
      status: "ready",
      soul_id: "ed52bf9b-f1c8-421e-9a2e-c418f01fc3b0",
    },
    {
      id: "00c9863d-7986-461b-8889-48b4812a0eb7",
      name: "Bohemian Charm",
      type: "soul_2",
      status: "ready",
      soul_id: "00c9863d-7986-461b-8889-48b4812a0eb7",
    },
    {
      id: "da98c156-6c1c-47ce-9fa3-f4544f09f8b3",
      name: "Whimsical Lace Muse",
      type: "soul_2",
      status: "ready",
      soul_id: "da98c156-6c1c-47ce-9fa3-f4544f09f8b3",
    },
    {
      id: "b6b010f2-7f50-4f48-b906-ed7ac008e7ef",
      name: "Serene Forest Muse",
      type: "soul_2",
      status: "ready",
      soul_id: "b6b010f2-7f50-4f48-b906-ed7ac008e7ef",
    },
    {
      id: "cd5a26fd-fd0e-4e10-bf7a-be542b56fdb1",
      name: "Rise of the Fierce Spirit",
      type: "soul_2",
      status: "ready",
      soul_id: "cd5a26fd-fd0e-4e10-bf7a-be542b56fdb1",
    },
    {
      id: "5a7a3cb8-8be1-4625-8b13-dce63732d970",
      name: "Whimsical Unicorn Persona",
      type: "soul_2",
      status: "ready",
      soul_id: "5a7a3cb8-8be1-4625-8b13-dce63732d970",
    },
    {
      id: "034fe6c3-f2a4-46eb-8b87-51d54af93d0e",
      name: "Versatile Elegance Unleashed",
      type: "soul_2",
      status: "ready",
      soul_id: "034fe6c3-f2a4-46eb-8b87-51d54af93d0e",
    },
    {
      id: "05991603-a75d-4a97-897b-0eeaa493285a",
      name: "Elegant Diva Vibes",
      type: "soul_2",
      status: "ready",
      soul_id: "05991603-a75d-4a97-897b-0eeaa493285a",
    },
    {
      id: "607322e0-7a07-49cb-8d1c-36c12c32534f",
      name: "Radiant Joy Bringer",
      type: "soul_2",
      status: "ready",
      soul_id: "607322e0-7a07-49cb-8d1c-36c12c32534f",
    },
    {
      id: "e293040b-938d-4143-9dc1-e59f9e8cf47e",
      name: "Radiant Silk Dream",
      type: "soul_2",
      status: "ready",
      soul_id: "e293040b-938d-4143-9dc1-e59f9e8cf47e",
    },
    {
      id: "40ff99d4-7ef8-4ad0-a40a-4183e3edf5e8",
      name: "Chic Serenity Vibe",
      type: "soul_2",
      status: "ready",
      soul_id: "40ff99d4-7ef8-4ad0-a40a-4183e3edf5e8",
    },
    {
      id: "a3e89eda-7911-4cc9-94ad-1682b85d353e",
      name: "Urban Elegance Unveiled",
      type: "soul_2",
      status: "ready",
      soul_id: "a3e89eda-7911-4cc9-94ad-1682b85d353e",
    },
  ];
}

export const higgsFieldRouter = router({
  /**
   * List all available Soul Cinema & Soul 2.0 characters
   */
  listCharacters: protectedProcedure.query(async () => {
    try {
      const characters = await fetchHiggsFieldCharactersFromMCP();
      return {
        success: true,
        characters,
        total: characters.length,
      };
    } catch (error) {
      console.error("[Higgsfield] Error listing characters:", error);
      const defaults = getDefaultCharacters();
      return {
        success: false,
        characters: defaults,
        total: defaults.length,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  /**
   * Get Soul 2.0 specific characters
   */
  getSoul2Characters: protectedProcedure.query(async () => {
    try {
      const characters = await fetchHiggsFieldCharactersFromMCP();
      const soul2 = characters.filter((c) => c.type === "soul_2");

      return {
        success: true,
        characters: soul2,
        total: soul2.length,
      };
    } catch (error) {
      console.error("[Higgsfield] Error getting Soul 2.0 characters:", error);
      const defaults = getDefaultCharacters();
      return {
        success: false,
        characters: defaults,
        total: defaults.length,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  /**
   * Get Soul Cinema specific characters
   */
  getSoulCinemaCharacters: protectedProcedure.query(async () => {
    try {
      const characters = await fetchHiggsFieldCharactersFromMCP();
      const soulCinema = characters.filter((c) => c.type === "soul_cinema");

      return {
        success: true,
        characters: soulCinema,
        total: soulCinema.length,
      };
    } catch (error) {
      console.error("[Higgsfield] Error getting Soul Cinema characters:", error);
      return {
        success: false,
        characters: [],
        total: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  /**
   * Search characters by name
   */
  searchCharacters: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      try {
        const characters = await fetchHiggsFieldCharactersFromMCP();
        const query = input.query.toLowerCase();

        const filtered = characters.filter((c) =>
          c.name.toLowerCase().includes(query)
        );

        return {
          success: true,
          characters: filtered,
          total: filtered.length,
        };
      } catch (error) {
        console.error("[Higgsfield] Error searching characters:", error);
        return {
          success: false,
          characters: [],
          total: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get character by ID
   */
  getCharacter: protectedProcedure
    .input(z.object({ characterId: z.string() }))
    .query(async ({ input }) => {
      try {
        const characters = await fetchHiggsFieldCharactersFromMCP();
        const character = characters.find((c) => c.id === input.characterId);

        if (!character) {
          return {
            success: false,
            error: "Character not found",
          };
        }

        return {
          success: true,
          character,
        };
      } catch (error) {
        console.error("[Higgsfield] Error getting character:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Clear character cache (admin only)
   */
  clearCache: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    characterCache = null;
    return { success: true, message: "Cache cleared" };
  }),
});
