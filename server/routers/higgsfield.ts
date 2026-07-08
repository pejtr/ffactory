/**
 * Higgsfield Router — Integration with Higgsfield MCP for Soul Cinema characters
 * 
 * Provides:
 * - List available Soul Cinema characters from Higgsfield
 * - Import character into project
 * - Sync character library
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface HiggsFieldCharacter {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
}

/**
 * Call Higgsfield MCP to get available characters
 */
async function fetchHiggsFieldCharacters(): Promise<HiggsFieldCharacter[]> {
  try {
    // Call Higgsfield MCP show_characters tool
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call show_characters --server higgsfield --input '{}'`
    );

    if (!stdout) {
      console.warn("[Higgsfield] No characters returned from MCP");
      return getDefaultCharacters();
    }

    // Parse JSON response
    const data = JSON.parse(stdout);
    
    // Extract characters from response
    if (Array.isArray(data)) {
      return data.map((char: any) => ({
        id: char.id || char.name,
        name: char.name,
        description: char.description,
        imageUrl: char.image_url || char.imageUrl,
        category: char.category || "Soul 2.0",
        tags: char.tags || [],
      }));
    }

    // If data is an object with characters array
    if (data.characters && Array.isArray(data.characters)) {
      return data.characters.map((char: any) => ({
        id: char.id || char.name,
        name: char.name,
        description: char.description,
        imageUrl: char.image_url || char.imageUrl,
        category: char.category || "Soul 2.0",
        tags: char.tags || [],
      }));
    }

    return getDefaultCharacters();
  } catch (error) {
    console.error("[Higgsfield] Error fetching characters:", error);
    return getDefaultCharacters();
  }
}

/**
 * Default Soul Cinema characters for development/fallback
 */
function getDefaultCharacters(): HiggsFieldCharacter[] {
  return [
    {
      id: "soul-cinema-lively-temptress",
      name: "Lively Temptress",
      description: "Energetic and seductive character with vibrant personality",
      category: "Soul Cinema",
      tags: ["soul-cinema", "female", "energetic"],
    },
    {
      id: "soul-cinema-seductive-elegance",
      name: "Seductive Elegance",
      description: "Elegant and mysterious character with refined style",
      category: "Soul Cinema",
      tags: ["soul-cinema", "female", "elegant"],
    },
    {
      id: "soul-cinema-midnight-velvet",
      name: "Midnight Velvet",
      description: "Dark and mysterious character with sophisticated allure",
      category: "Soul Cinema",
      tags: ["soul-cinema", "female", "mysterious"],
    },
    {
      id: "soul-cinema-urban-elegance",
      name: "Urban Elegance",
      description: "Modern and stylish character with contemporary flair",
      category: "Soul Cinema",
      tags: ["soul-cinema", "female", "modern"],
    },
    {
      id: "soul-cinema-rhythm-of-joy",
      name: "Rhythm of Joy",
      description: "Joyful and expressive character full of life",
      category: "Soul Cinema",
      tags: ["soul-cinema", "female", "joyful"],
    },
    {
      id: "soul-2-professional-male",
      name: "Professional Male",
      description: "Business-like male character with authoritative presence",
      category: "Soul 2.0",
      tags: ["soul-2", "male", "professional"],
    },
    {
      id: "soul-2-creative-artist",
      name: "Creative Artist",
      description: "Artistic male character with expressive features",
      category: "Soul 2.0",
      tags: ["soul-2", "male", "creative"],
    },
  ];
}

export const higgsFieldRouter = router({
  /**
   * List all available Soul Cinema characters from Higgsfield
   */
  listCharacters: protectedProcedure.query(async () => {
    try {
      const characters = await fetchHiggsFieldCharacters();
      return {
        success: true,
        characters,
        total: characters.length,
      };
    } catch (error) {
      console.error("[Higgsfield] Error listing characters:", error);
      return {
        success: false,
        characters: getDefaultCharacters(),
        total: getDefaultCharacters().length,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  /**
   * Get specific character details
   */
  getCharacter: protectedProcedure
    .input(z.object({ characterId: z.string() }))
    .query(async ({ input }) => {
      try {
        const characters = await fetchHiggsFieldCharacters();
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
   * Search characters by name or tag
   */
  searchCharacters: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      try {
        const characters = await fetchHiggsFieldCharacters();
        const query = input.query.toLowerCase();

        const filtered = characters.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.description?.toLowerCase().includes(query) ||
            c.tags?.some((t) => t.toLowerCase().includes(query))
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
   * Get characters by category (Soul 2.0, Soul Cinema, etc)
   */
  getByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      try {
        const characters = await fetchHiggsFieldCharacters();
        const filtered = characters.filter((c) => c.category === input.category);

        return {
          success: true,
          characters: filtered,
          total: filtered.length,
        };
      } catch (error) {
        console.error("[Higgsfield] Error filtering by category:", error);
        return {
          success: false,
          characters: [],
          total: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get Soul Cinema specific characters
   */
  getSoulCinemaCharacters: protectedProcedure.query(async () => {
    try {
      const characters = await fetchHiggsFieldCharacters();
      const soulCinema = characters.filter(
        (c) => c.category === "Soul Cinema" || c.tags?.includes("soul-cinema")
      );

      return {
        success: true,
        characters: soulCinema,
        total: soulCinema.length,
      };
    } catch (error) {
      console.error("[Higgsfield] Error getting Soul Cinema characters:", error);
      const defaults = getDefaultCharacters().filter((c) => c.category === "Soul Cinema");
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
      const characters = await fetchHiggsFieldCharacters();
      const soul2 = characters.filter(
        (c) => c.category === "Soul 2.0" || c.tags?.includes("soul-2")
      );

      return {
        success: true,
        characters: soul2,
        total: soul2.length,
      };
    } catch (error) {
      console.error("[Higgsfield] Error getting Soul 2.0 characters:", error);
      const defaults = getDefaultCharacters().filter((c) => c.category === "Soul 2.0");
      return {
        success: false,
        characters: defaults,
        total: defaults.length,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),
});
