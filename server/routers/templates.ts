import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { scriptTemplates, personas } from "../../drizzle/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ── Built-in "Trap & Switch" template ─────────────────────────────────────────
const TRAP_AND_SWITCH_TEMPLATE = {
  title: "The Trap & Switch",
  genre: "horror",
  format: "shorts",
  description:
    "A supernatural horror micro-short where a villain tricks a victim into a body-swap ritual. 6 scenes, ~90 seconds. Perfect for TikTok/Shorts.",
  viralScore: 9.2,
  tags: "horror,body-swap,supernatural,thriller,shorts",
  personaSlots: [
    {
      slot: "CHARACTER_A",
      label: "Victim (Character A)",
      description: "The unsuspecting victim — innocent, curious, easily manipulated.",
      defaultName: "Emma",
      defaultRole: "victim",
      defaultVoiceStyle: "warm, confused, panicked",
    },
    {
      slot: "CHARACTER_B",
      label: "Villain (Character B)",
      description: "The calculated villain — sinister, calm, prepared.",
      defaultName: "Mara",
      defaultRole: "villain",
      defaultVoiceStyle: "calm, sinister, predatory",
    },
  ],
  variables: [
    { key: "SETTING_A", label: "Character A's environment", type: "text", defaultValue: "bright bedroom" },
    { key: "SETTING_B", label: "Character B's environment", type: "text", defaultValue: "dark basement" },
    { key: "RITUAL_OBJECT", label: "Ritual object used", type: "text", defaultValue: "zip-tie" },
    { key: "CORE_PREMISE", label: "Title overlay / core premise", type: "text", defaultValue: "The Betrayal" },
    { key: "VILLAIN_FINAL_LINE", label: "Villain's final gloat line", type: "text", defaultValue: "I like wearing your skin." },
  ],
  scenes: [
    {
      id: 1, title: "Teaser Hook", duration: 3,
      setting: "{{SETTING_A}}",
      action: "Close-up of {{CHARACTER_A}} looking completely different. Text overlay: '{{CORE_PREMISE}}'",
      dialogue: "{{CHARACTER_A}}: '{{VILLAIN_FINAL_LINE}}'",
      cameraMotion: "extreme_close_up", mood: "shocking",
      personaSlots: ["CHARACTER_A"],
      notes: "Start with the ending — most shocking line first.",
    },
    {
      id: 2, title: "Innocent Setup", duration: 12,
      setting: "Split screen: {{SETTING_A}} and {{SETTING_B}}",
      action: "Back-and-forth video call. {{CHARACTER_A}} in bright environment, {{CHARACTER_B}} in dark environment.",
      dialogue: "{{CHARACTER_B}}: 'I have to show you something.'\n{{CHARACTER_A}}: 'What is it?'\n{{CHARACTER_B}}: 'Just watch.'",
      cameraMotion: "static", mood: "curious",
      personaSlots: ["CHARACTER_A", "CHARACTER_B"],
    },
    {
      id: 3, title: "The Catalyst", duration: 10,
      setting: "{{SETTING_B}}",
      action: "{{CHARACTER_B}} silently uses {{RITUAL_OBJECT}}. {{CHARACTER_A}} watches with growing concern.",
      dialogue: "{{CHARACTER_A}}: 'What are you doing? Stop.'",
      cameraMotion: "slow_zoom_in", mood: "dread",
      personaSlots: ["CHARACTER_A", "CHARACTER_B"],
    },
    {
      id: 4, title: "Loss of Control", duration: 15,
      setting: "Split screen",
      action: "{{CHARACTER_A}} acts against their will, repeating phrases. {{CHARACTER_B}} watches with predatory smile. Both black out.",
      dialogue: "{{CHARACTER_A}}: 'Switch with me. Switch with me...' (involuntary)\n{{CHARACTER_B}}: 'Switch with me.' (smiles)",
      cameraMotion: "handheld_shaky", mood: "horror",
      personaSlots: ["CHARACTER_A", "CHARACTER_B"],
    },
    {
      id: 5, title: "The Realization", duration: 35,
      setting: "{{SETTING_B}} (now occupied by {{CHARACTER_A}})",
      action: "{{CHARACTER_A}} wakes up in dark environment, notices {{RITUAL_OBJECT}}. {{CHARACTER_B}} wakes in {{SETTING_A}}, smiles triumphantly.",
      dialogue: "{{CHARACTER_A}}: 'Where am I? Why do I sound like that?'\n{{CHARACTER_B}}: (gasps, touches new face, smiles wickedly)",
      cameraMotion: "dolly_in", mood: "claustrophobic",
      personaSlots: ["CHARACTER_A", "CHARACTER_B"],
    },
    {
      id: 6, title: "The Gloat", duration: 15,
      setting: "Split screen final confrontation",
      action: "{{CHARACTER_A}} begs and panics. {{CHARACTER_B}} delivers calm final line.",
      dialogue: "{{CHARACTER_A}}: 'No, please! What did you do?!'\n{{CHARACTER_B}}: '{{VILLAIN_FINAL_LINE}}'",
      cameraMotion: "static", mood: "sinister",
      personaSlots: ["CHARACTER_A", "CHARACTER_B"],
    },
  ],
};

export const templatesRouter = router({
  // ── Script Templates ─────────────────────────────────────────────────────────
  templates: router({
    list: protectedProcedure
      .input(z.object({ genre: z.string().optional() }).optional())
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        return db
          .select()
          .from(scriptTemplates)
          .where(or(eq(scriptTemplates.userId, ctx.user.id), eq(scriptTemplates.isPublic, 1)))
          .orderBy(desc(scriptTemplates.viralScore))
          .limit(50);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const [row] = await db
          .select()
          .from(scriptTemplates)
          .where(eq(scriptTemplates.id, input.id))
          .limit(1);
        return row ?? null;
      }),

    getBuiltIn: protectedProcedure.query(async () => {
      return TRAP_AND_SWITCH_TEMPLATE;
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        genre: z.string().default("horror"),
        format: z.string().default("shorts"),
        description: z.string().optional(),
        scenes: z.any().optional(),
        personaSlots: z.any().optional(),
        variables: z.any().optional(),
        isPublic: z.boolean().default(false),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const [result] = await db.insert(scriptTemplates).values({
          userId: ctx.user.id,
          title: input.title,
          genre: input.genre,
          format: input.format,
          description: input.description,
          scenes: input.scenes,
          personaSlots: input.personaSlots,
          variables: input.variables,
          isPublic: input.isPublic ? 1 : 0,
          tags: input.tags,
        });
        return { id: (result as any).insertId };
      }),

    generateFromIdea: protectedProcedure
      .input(z.object({
        idea: z.string().min(10),
        genre: z.string().default("horror"),
        format: z.string().default("shorts"),
        sceneCount: z.number().min(3).max(10).default(6),
        language: z.string().default("cs"),
      }))
      .mutation(async ({ ctx, input }) => {
        const prompt = `You are a professional screenwriter specializing in viral short-form video content.

Create a parametric script template for a ${input.format} video in the ${input.genre} genre.
Idea: "${input.idea}"
Number of scenes: ${input.sceneCount}
Language for dialogue: ${input.language}

Return a JSON object with this exact structure:
{
  "title": "Template title",
  "description": "Brief description",
  "viralScore": 7.5,
  "personaSlots": [{"slot": "CHARACTER_A", "label": "Role name", "description": "Character description", "defaultName": "Name", "defaultRole": "hero", "defaultVoiceStyle": "voice description"}],
  "variables": [{"key": "SETTING_MAIN", "label": "Main setting", "type": "text", "defaultValue": "default value"}],
  "scenes": [{"id": 1, "title": "Scene title", "duration": 10, "setting": "{{SETTING_MAIN}}", "action": "What happens. Use {{VARIABLE_NAME}} placeholders.", "dialogue": "{{CHARACTER_A}}: 'Line here.'", "cameraMotion": "static", "mood": "tense", "personaSlots": ["CHARACTER_A"], "notes": "Optional note"}]
}

Use {{PLACEHOLDER}} syntax for all character names, settings, and key story elements.`;

        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        const templateData = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const [result] = await db.insert(scriptTemplates).values({
          userId: ctx.user.id,
          title: templateData.title || input.idea.slice(0, 50),
          genre: input.genre,
          format: input.format,
          description: templateData.description,
          scenes: templateData.scenes,
          personaSlots: templateData.personaSlots,
          variables: templateData.variables,
          viralScore: templateData.viralScore,
          tags: input.genre,
        });

        return { id: (result as any).insertId, template: templateData };
      }),

    fillWithPersonas: protectedProcedure
      .input(z.object({
        templateId: z.number().optional(),
        templateData: z.any().optional(),
        personaBindings: z.record(z.string(), z.number()),
        variableValues: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        let template: any = input.templateData;
        if (!template && input.templateId) {
          const [row] = await db.select().from(scriptTemplates).where(eq(scriptTemplates.id, input.templateId)).limit(1);
          template = row;
        }
        if (!template) throw new Error("Template not found");

        const personaIds = Object.values(input.personaBindings);
        const loadedPersonas: Record<number, any> = {};
        for (const pid of personaIds) {
          const [p] = await db.select().from(personas).where(and(eq(personas.id, pid), eq(personas.userId, ctx.user.id))).limit(1);
          if (p) loadedPersonas[pid] = p;
        }

        const replacements: Record<string, string> = { ...(input.variableValues || {}) };
        for (const [slot, personaId] of Object.entries(input.personaBindings)) {
          const p = loadedPersonas[personaId];
          if (p) replacements[slot] = p.name;
        }

        const scenes = (template.scenes || []) as any[];
        const filledScenes = scenes.map((scene: any) => {
          let action = scene.action || "";
          let dialogue = scene.dialogue || "";
          let setting = scene.setting || "";
          for (const [key, value] of Object.entries(replacements)) {
            const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
            action = action.replace(re, value);
            dialogue = dialogue.replace(re, value);
            setting = setting.replace(re, value);
          }
          return { ...scene, action, dialogue, setting };
        });

        if (input.templateId) {
          await db.update(scriptTemplates).set({ usageCount: sql`usage_count + 1` }).where(eq(scriptTemplates.id, input.templateId));
        }

        return { filledScenes, replacements, personaDetails: loadedPersonas };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.delete(scriptTemplates).where(and(eq(scriptTemplates.id, input.id), eq(scriptTemplates.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // ── Personas ─────────────────────────────────────────────────────────────────
  personas: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(personas).where(eq(personas.userId, ctx.user.id)).orderBy(desc(personas.createdAt));
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const [row] = await db.select().from(personas).where(and(eq(personas.id, input.id), eq(personas.userId, ctx.user.id))).limit(1);
        return row ?? null;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        role: z.string().optional(),
        gender: z.string().optional(),
        age: z.string().optional(),
        appearance: z.string().optional(),
        personality: z.string().optional(),
        voiceStyle: z.string().optional(),
        catchphrase: z.string().optional(),
        backstory: z.string().optional(),
        avatarUrl: z.string().optional(),
        characterId: z.number().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const [result] = await db.insert(personas).values({ userId: ctx.user.id, ...input });
        return { id: (result as any).insertId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        role: z.string().optional(),
        gender: z.string().optional(),
        age: z.string().optional(),
        appearance: z.string().optional(),
        personality: z.string().optional(),
        voiceStyle: z.string().optional(),
        catchphrase: z.string().optional(),
        backstory: z.string().optional(),
        avatarUrl: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const { id, ...data } = input;
        await db.update(personas).set(data).where(and(eq(personas.id, id), eq(personas.userId, ctx.user.id)));
        return { success: true };
      }),

    generateFromDescription: protectedProcedure
      .input(z.object({
        description: z.string().min(10),
        genre: z.string().default("horror"),
        role: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const prompt = `You are a character designer for short-form viral video content.

Create a detailed persona profile based on: "${input.description}"
Genre: ${input.genre}, Role: ${input.role || "any"}

Return JSON:
{
  "name": "Character name",
  "role": "villain|hero|victim|mentor|trickster|sidekick",
  "gender": "female|male|non-binary",
  "age": "20s",
  "appearance": "Physical description in 2-3 sentences",
  "personality": "Personality traits in 2-3 sentences",
  "voiceStyle": "calm and sinister|panicked|warm|etc",
  "catchphrase": "A memorable line",
  "backstory": "Brief backstory in 2-3 sentences"
}`;

        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        const personaData = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const [result] = await db.insert(personas).values({
          userId: ctx.user.id,
          name: personaData.name || "New Persona",
          role: personaData.role,
          gender: personaData.gender,
          age: personaData.age,
          appearance: personaData.appearance,
          personality: personaData.personality,
          voiceStyle: personaData.voiceStyle,
          catchphrase: personaData.catchphrase,
          backstory: personaData.backstory,
          tags: input.genre,
        });

        return { id: (result as any).insertId, persona: personaData };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.delete(personas).where(and(eq(personas.id, input.id), eq(personas.userId, ctx.user.id)));
        return { success: true };
      }),
  }),
});
