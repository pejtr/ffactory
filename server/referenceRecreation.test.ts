import { describe, it, expect, vi, beforeEach } from "vitest";
import { REFERENCE_RECREATION_TEMPLATES } from "./routers/templates";

// ─── Template structure tests ─────────────────────────────────────────────────
describe("REFERENCE_RECREATION_TEMPLATES", () => {
  it("should contain exactly 3 templates", () => {
    expect(REFERENCE_RECREATION_TEMPLATES).toHaveLength(3);
  });

  it("should include Football Girl as first template", () => {
    const footballGirl = REFERENCE_RECREATION_TEMPLATES[0];
    expect(footballGirl.id).toBe("football-girl");
    expect(footballGirl.title).toBe("Football Girl");
    expect(footballGirl.viralScore).toBeGreaterThanOrEqual(9.5);
  });

  it("should include Office Superhero as second template", () => {
    const officeHero = REFERENCE_RECREATION_TEMPLATES[1];
    expect(officeHero.id).toBe("office-superhero");
    expect(officeHero.viralScore).toBeGreaterThanOrEqual(9.0);
  });

  it("should include Street Chef Takeover as third template", () => {
    const streetChef = REFERENCE_RECREATION_TEMPLATES[2];
    expect(streetChef.id).toBe("street-chef");
    expect(streetChef.viralScore).toBeGreaterThanOrEqual(9.0);
  });

  it("each template should have required fields", () => {
    for (const tpl of REFERENCE_RECREATION_TEMPLATES) {
      expect(tpl.id).toBeTruthy();
      expect(tpl.title).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(tpl.viralScore).toBeGreaterThan(0);
      expect(tpl.aspectRatio).toMatch(/^\d+:\d+$/);
      expect(tpl.durationSeconds).toBeGreaterThan(0);
      expect(tpl.prompt).toBeDefined();
      expect(tpl.prompt.master_prompt).toBeTruthy();
      expect(tpl.prompt.model).toBe("seedance_2_0_non_fast");
      expect(tpl.prompt.mode).toBe("video_reference_recreation");
    }
  });

  it("each template prompt should have valid aspect_ratio", () => {
    const validRatios = ["16:9", "9:16", "1:1", "4:3", "3:4"];
    for (const tpl of REFERENCE_RECREATION_TEMPLATES) {
      expect(validRatios).toContain(tpl.prompt.aspect_ratio);
    }
  });

  it("each template prompt should have duration_seconds of 5 or 10", () => {
    for (const tpl of REFERENCE_RECREATION_TEMPLATES) {
      expect([5, 10]).toContain(tpl.prompt.duration_seconds);
    }
  });

  it("each template should have negative_prompt to prevent common artifacts", () => {
    for (const tpl of REFERENCE_RECREATION_TEMPLATES) {
      expect(tpl.prompt.negative_prompt).toBeTruthy();
      expect(tpl.prompt.negative_prompt).toContain("face drift");
    }
  });

  it("each template should have continuity_rules array", () => {
    for (const tpl of REFERENCE_RECREATION_TEMPLATES) {
      expect(Array.isArray(tpl.prompt.continuity_rules)).toBe(true);
      expect((tpl.prompt.continuity_rules as string[]).length).toBeGreaterThan(0);
    }
  });

  it("Football Girl should have shot_script with 5 shots", () => {
    const footballGirl = REFERENCE_RECREATION_TEMPLATES[0];
    expect(Array.isArray(footballGirl.prompt.shot_script)).toBe(true);
    expect((footballGirl.prompt.shot_script as unknown[]).length).toBe(5);
  });

  it("Football Girl should have style guide", () => {
    const footballGirl = REFERENCE_RECREATION_TEMPLATES[0];
    expect(footballGirl.prompt.style).toBeDefined();
    expect(footballGirl.prompt.style?.look).toBeTruthy();
    expect(footballGirl.prompt.style?.tone).toBeTruthy();
  });

  it("templates should be sorted by viralScore descending", () => {
    const scores = REFERENCE_RECREATION_TEMPLATES.map(t => t.viralScore);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
  });

  it("all templates should use 9:16 aspect ratio (vertical/viral)", () => {
    for (const tpl of REFERENCE_RECREATION_TEMPLATES) {
      expect(tpl.aspectRatio).toBe("9:16");
      expect(tpl.prompt.aspect_ratio).toBe("9:16");
    }
  });
});

// ─── falai Seedance functions (mocked) ───────────────────────────────────────
describe("Seedance 2.0 API functions (mocked)", () => {
  it("seedance20TextToVideo should be exported from falai.ts", async () => {
    const falai = await import("./falai");
    expect(typeof falai.seedance20TextToVideo).toBe("function");
  });

  it("seedance20ReferenceRecreation should be exported from falai.ts", async () => {
    const falai = await import("./falai");
    expect(typeof falai.seedance20ReferenceRecreation).toBe("function");
  });
});

// ─── Router registration ──────────────────────────────────────────────────────
describe("referenceRecreationRouter registration", () => {
  it("should be importable from routers/referenceRecreation.ts", async () => {
    const mod = await import("./routers/referenceRecreation");
    expect(mod.referenceRecreationRouter).toBeDefined();
  });

  it("should export SeedancePrompt type via the router module", async () => {
    const mod = await import("./routers/referenceRecreation");
    // Type-only check — just verify the module loads without errors
    expect(mod).toBeDefined();
  });
});
