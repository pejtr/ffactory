import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { scriptTemplates, personas } from "../../drizzle/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ── Reference Recreation Templates ──────────────────────────────────────────
export const REFERENCE_RECREATION_TEMPLATES = [
  {
    id: "football-girl",
    title: "Football Girl",
    category: "viral-sports",
    description: "Hyper-realistic viral football stadium clip. A glamorous woman walks onto the pitch and scores a goal. Absurd, funny, unbelievable — filmed as if totally real. 10s, 9:16.",
    viralScore: 9.8,
    tags: "sports,viral,comedy,stadium,9:16",
    aspectRatio: "9:16",
    durationSeconds: 10,
    prompt: {
      model: "seedance_2_0_non_fast",
      mode: "video_reference_recreation",
      aspect_ratio: "9:16",
      duration_seconds: 10,
      reference_usage: { "@Video1": "Use only for pacing, shot order, stadium realism, crowd-to-pitch transition, and handheld/broadcast camera energy. Do not copy exact faces, logos, scoreboard text, or watermarks." },
      master_prompt: "Create a hyper-realistic viral football stadium clip. A glamorous young blonde woman in a fitted dark brown sleeveless dress sits casually among loud yellow-shirt football fans, holding a burger in one hand and a bright blue drink can in the other. She looks bored, takes a bite, sips the drink, then suddenly notices the match. The sequence escalates from crowd close-up to impossible sports fantasy: she leaves the seats, walks confidently onto the pitch, approaches a football, and effortlessly scores a goal while the stadium erupts. She turns back toward camera with a mischievous smile, as if this was completely normal. Realistic broadcast sports cinematography, crowded stadium under floodlights, viral social-media energy, absurd but physically smooth.",
      shot_script: [
        { time: "00:00-00:02", shot: "Screen-recorded viral setup", camera: "vertical social media screen-recording feel", action: "Begin on a phone-like social video frame. Quick push into the actual stadium footage.", visual_details: "Dark UI edges, then transition into full-screen stadium broadcast." },
        { time: "00:02-00:05", shot: "The spectator", camera: "tight broadcast crowd close-up, slight handheld wobble", action: "Glamorous blonde woman in dark brown dress sits between excited yellow-shirt fans. She calmly holds a burger and a blue can, takes a bite, then sips.", visual_details: "Bright yellow jerseys, packed stands, stadium floodlights, shallow depth of field." },
        { time: "00:05-00:07", shot: "Decision moment", camera: "medium close-up, slow push-in", action: "She glances toward the pitch, raises one eyebrow, casually stands up.", visual_details: "Comedic confidence, no panic." },
        { time: "00:07-00:09", shot: "Walk onto the pitch", camera: "sideline tracking shot from behind", action: "She steps onto the grass with complete confidence. Security and players hesitate.", visual_details: "Green pitch, white touchline, floodlit cinematic realism." },
        { time: "00:09-00:10", shot: "Goal and smile", camera: "fast pan to net, then whip back to her", action: "She kicks the ball cleanly. Stadium explodes. She smiles mischievously, picks up her burger.", visual_details: "Crowd eruption, iconic final frame." }
      ],
      style: { look: "hyper-realistic sports broadcast mixed with viral phone repost aesthetic", lighting: "bright stadium floodlights, crisp evening match atmosphere", color_palette: "yellow fan shirts, green pitch, dark brown dress, blue drink can contrast", motion: "smooth character motion, realistic walking and kicking physics", tone: "absurd, funny, unbelievable, but filmed as if totally real" },
      negative_prompt: "avoid readable logos, avoid real team names, avoid warped hands, avoid broken legs, avoid face drift, avoid outfit drift, avoid jitter, avoid temporal flicker, avoid text artifacts",
      continuity_rules: ["Preserve the same woman throughout: blonde hair, dark brown sleeveless fitted dress.", "Burger and blue can must appear in crowd scene and ending gag.", "Keep crowd dominated by yellow shirts without readable logos.", "Final frame must be her smiling at camera after scoring."]
    }
  },
  {
    id: "office-superhero",
    title: "Office Superhero",
    category: "viral-comedy",
    description: "A bored office worker discovers telekinesis during a dull meeting. Viral deadpan comedy escalation from mundane to spectacular. 9:16 vertical.",
    viralScore: 9.3,
    tags: "comedy,office,superpowers,viral,9:16",
    aspectRatio: "9:16",
    durationSeconds: 10,
    prompt: {
      model: "seedance_2_0_non_fast",
      mode: "video_reference_recreation",
      aspect_ratio: "9:16",
      duration_seconds: 10,
      master_prompt: "A hyper-realistic viral office comedy clip. A bored young professional in a grey suit sits in a dull corporate meeting, visibly zoning out. He accidentally knocks over his coffee — but instead of spilling, it freezes mid-air. He stares at it. Slowly realizes he has telekinesis. He moves the cup back. Then the stapler. Then the entire conference table. His colleagues stare in disbelief. He straightens his tie, picks up his laptop, and walks out like nothing happened. Realistic corporate office cinematography, fluorescent lighting, viral social-media energy, deadpan comedy.",
      style: { look: "realistic corporate office with subtle VFX escalation", lighting: "fluorescent office lighting, slightly overexposed", color_palette: "grey suits, white walls, beige carpet, coffee brown", motion: "static camera escalating to slow tracking shot as powers activate", tone: "deadpan, absurd, relatable, viral" },
      negative_prompt: "avoid cartoon effects, avoid obvious CGI, avoid unrealistic physics, avoid face drift, avoid warped hands, avoid text artifacts",
      continuity_rules: ["Same man throughout: grey suit, white shirt, slightly loosened tie.", "Coffee cup must be the catalyst object.", "Keep office environment realistic — no sci-fi elements.", "Final frame: him walking out, colleagues frozen in shock."]
    }
  },
  {
    id: "street-chef",
    title: "Street Chef Takeover",
    category: "viral-food",
    description: "A street food vendor casually outperforms a Michelin-star chef in his own restaurant. Viral food comedy with stunning culinary visuals. 9:16.",
    viralScore: 9.1,
    tags: "food,comedy,viral,chef,restaurant,9:16",
    aspectRatio: "9:16",
    durationSeconds: 10,
    prompt: {
      model: "seedance_2_0_non_fast",
      mode: "video_reference_recreation",
      aspect_ratio: "9:16",
      duration_seconds: 10,
      master_prompt: "A hyper-realistic viral food comedy clip. A humble street food vendor in a worn apron and baseball cap wanders into an upscale Michelin-star restaurant kitchen. The head chef in a white toque scoffs at him. The vendor calmly pulls out a battered wok and a small gas burner, sets up in the corner, and starts cooking. The aroma fills the kitchen. The Michelin chef watches, confused. The vendor plates a dish in 60 seconds. The chef tastes it. His face transforms — pure shock and reverence. The vendor shrugs, packs up, and walks out. Cinematic food photography, steam and fire, close-up textures, viral absurdity.",
      style: { look: "cinematic food documentary meets viral comedy", lighting: "warm kitchen lighting, dramatic steam and fire highlights", color_palette: "white chef coats, stainless steel, golden food textures, worn apron", motion: "handheld documentary style, close-up food shots, reaction close-ups", tone: "humble confidence, absurd, heartwarming, viral" },
      negative_prompt: "avoid unrealistic food physics, avoid face drift, avoid warped hands, avoid text artifacts, avoid cartoon effects",
      continuity_rules: ["Street vendor: worn apron, baseball cap, calm expression throughout.", "Michelin chef: white toque, pristine whites, starts dismissive ends reverent.", "The wok and gas burner are the key props.", "Final frame: vendor walking out, chef staring at the empty plate."]
    }
  }
];

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

    getBuiltInRefRec: protectedProcedure.query(async () => {
      return REFERENCE_RECREATION_TEMPLATES;
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
