import puppeteer from "puppeteer-core";

const CHROMIUM_PATH = process.env.CHROMIUM_PATH || "/usr/bin/chromium";

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ─── HTML Template for Channel Blueprint PDF ─────────────────────────────────
export function buildBlueprintHtml(data: {
  niche: string;
  brandIdentity: {
    channelNames: string[];
    tagline: string;
    colors: string[];
    visualStyle: string;
    contentTone: string;
    audiencePersona: string;
  };
  videoPlan: {
    videos: Array<{
      id: number;
      title: string;
      description: string;
      tags: string[];
      thumbnailText: string;
      chapters: string[];
      durationMinutes: number;
      category: string;
      viralPotential: number;
    }>;
  };
  roadmap: {
    weeks: Array<{
      week: number;
      milestone: string;
      actions: string[];
      metrics: string[];
      tips: string;
    }>;
    monetizationTimeline: string;
    keySuccessFactors: string[];
  };
}): string {
  const { niche, brandIdentity, videoPlan, roadmap } = data;
  const primaryColor = brandIdentity.colors[0] || "#6366f1";
  const secondaryColor = brandIdentity.colors[1] || "#0ea5e9";

  const videoRows = videoPlan.videos
    .map(
      (v) => `
    <tr>
      <td class="num">${v.id}</td>
      <td class="title">${escHtml(v.title)}</td>
      <td class="center">${v.durationMinutes} min</td>
      <td class="center">${escHtml(v.category)}</td>
      <td class="center viral">${v.viralPotential}/10</td>
      <td class="thumb">${escHtml(v.thumbnailText)}</td>
    </tr>`
    )
    .join("");

  const weekCards = roadmap.weeks
    .map(
      (w) => `
    <div class="week-card">
      <div class="week-header">
        <span class="week-num">Týden ${w.week}</span>
        <span class="week-milestone">${escHtml(w.milestone)}</span>
      </div>
      <div class="week-actions">
        ${w.actions.map((a) => `<span class="action-tag">${escHtml(a)}</span>`).join("")}
      </div>
      ${w.tips ? `<div class="week-tip">💡 ${escHtml(w.tips)}</div>` : ""}
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #e2e8f0; font-size: 11px; line-height: 1.5; }

  /* Cover page */
  .cover { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%); padding: 40px; text-align: center; page-break-after: always; }
  .cover-badge { background: ${primaryColor}22; border: 1px solid ${primaryColor}55; color: ${primaryColor}; padding: 6px 16px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
  .cover-title { font-size: 42px; font-weight: 900; letter-spacing: -1px; background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 8px; line-height: 1.1; }
  .cover-niche { font-size: 22px; color: #94a3b8; margin-bottom: 32px; }
  .cover-divider { width: 60px; height: 3px; background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor}); border-radius: 2px; margin: 0 auto 32px; }
  .cover-meta { display: flex; gap: 40px; justify-content: center; }
  .cover-meta-item { text-align: center; }
  .cover-meta-num { font-size: 28px; font-weight: 800; color: ${primaryColor}; }
  .cover-meta-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
  .cover-date { margin-top: 40px; font-size: 10px; color: #475569; }

  /* Sections */
  .section { padding: 32px; page-break-inside: avoid; }
  .section-title { font-size: 18px; font-weight: 800; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}33; padding-bottom: 8px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
  .section-subtitle { font-size: 13px; font-weight: 700; color: #94a3b8; margin-bottom: 12px; margin-top: 20px; }
  .page-break { page-break-before: always; }

  /* Brand Identity */
  .brand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .brand-card { background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 10px; padding: 16px; }
  .brand-card-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .brand-card-content { color: #e2e8f0; font-size: 11px; }
  .channel-name-primary { font-size: 18px; font-weight: 800; color: ${primaryColor}; }
  .channel-name-alt { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  .tagline { font-style: italic; font-size: 13px; color: #94a3b8; }
  .color-swatches { display: flex; gap: 8px; margin-top: 4px; }
  .color-swatch { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #2d2d3d; }

  /* Video table */
  .video-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .video-table th { background: #1e1e2e; color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; padding: 8px 6px; text-align: left; border-bottom: 1px solid #2d2d3d; }
  .video-table td { padding: 7px 6px; border-bottom: 1px solid #1a1a2e; vertical-align: top; }
  .video-table tr:nth-child(even) td { background: #0f0f1a; }
  .num { width: 28px; color: #64748b; font-weight: 700; text-align: center; }
  .title { font-weight: 600; color: #e2e8f0; max-width: 240px; }
  .center { text-align: center; color: #94a3b8; }
  .viral { color: #f59e0b; font-weight: 700; }
  .thumb { color: #ef4444; font-weight: 700; font-size: 10px; max-width: 80px; }

  /* Roadmap */
  .week-card { background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; break-inside: avoid; }
  .week-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .week-num { background: ${primaryColor}22; color: ${primaryColor}; border: 1px solid ${primaryColor}44; border-radius: 12px; padding: 2px 10px; font-size: 10px; font-weight: 700; white-space: nowrap; }
  .week-milestone { font-weight: 700; color: #e2e8f0; font-size: 12px; }
  .week-actions { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
  .action-tag { background: #0f0f1a; border: 1px solid #2d2d3d; color: #94a3b8; border-radius: 4px; padding: 2px 7px; font-size: 9px; }
  .week-tip { color: #60a5fa; font-size: 10px; font-style: italic; }

  /* Monetization box */
  .mono-box { background: #1a1a0a; border: 1px solid #ca8a0444; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
  .mono-box-title { color: #f59e0b; font-weight: 700; font-size: 12px; margin-bottom: 6px; }
  .mono-box-text { color: #fde68a; font-size: 11px; }

  /* Success factors */
  .success-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .success-item { background: #0a1a0a; border: 1px solid #16a34a33; border-radius: 6px; padding: 8px 12px; color: #86efac; font-size: 10px; display: flex; align-items: flex-start; gap: 6px; }
  .success-check { color: #22c55e; font-weight: 700; }

  /* Footer */
  .footer { text-align: center; color: #334155; font-size: 9px; padding: 20px; border-top: 1px solid #1e1e2e; margin-top: 20px; }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-badge">📺 Channel Empire Blueprint</div>
  <div class="cover-title">CHANNEL<br>BLUEPRINT</div>
  <div class="cover-niche">${escHtml(niche)}</div>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    <div class="cover-meta-item">
      <div class="cover-meta-num">30</div>
      <div class="cover-meta-label">Video nápadů</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-num">${roadmap.weeks.length}</div>
      <div class="cover-meta-label">Týdnů roadmapy</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-num">1</div>
      <div class="cover-meta-label">Brand identity</div>
    </div>
  </div>
  <div class="cover-date">Vygenerováno: ${new Date().toLocaleDateString("cs-CZ", { day: "2-digit", month: "long", year: "numeric" })} · Video Factory AI</div>
</div>

<!-- BRAND IDENTITY -->
<div class="section">
  <div class="section-title">🎨 Brand Identity</div>
  <div class="brand-grid">
    <div class="brand-card">
      <div class="brand-card-title">Název kanálu</div>
      <div class="brand-card-content">
        <div class="channel-name-primary">${escHtml(brandIdentity.channelNames[0] || "")}</div>
        ${brandIdentity.channelNames
          .slice(1)
          .map((n) => `<div class="channel-name-alt">Alt: ${escHtml(n)}</div>`)
          .join("")}
      </div>
    </div>
    <div class="brand-card">
      <div class="brand-card-title">Tagline</div>
      <div class="brand-card-content tagline">"${escHtml(brandIdentity.tagline)}"</div>
    </div>
    <div class="brand-card">
      <div class="brand-card-title">Barevná paleta</div>
      <div class="brand-card-content">
        <div class="color-swatches">
          ${brandIdentity.colors.map((c) => `<div class="color-swatch" style="background:${c}"></div>`).join("")}
        </div>
        <div style="margin-top:6px; color:#64748b; font-size:9px">${brandIdentity.colors.join(" · ")}</div>
      </div>
    </div>
    <div class="brand-card">
      <div class="brand-card-title">Cílová persona</div>
      <div class="brand-card-content">${escHtml(brandIdentity.audiencePersona)}</div>
    </div>
    <div class="brand-card" style="grid-column: span 2">
      <div class="brand-card-title">Vizuální styl & tón</div>
      <div class="brand-card-content">${escHtml(brandIdentity.visualStyle)} · ${escHtml(brandIdentity.contentTone)}</div>
    </div>
  </div>
</div>

<!-- VIDEO PLAN -->
<div class="section page-break">
  <div class="section-title">🎬 30 Video Plán</div>
  <table class="video-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Název videa</th>
        <th>Délka</th>
        <th>Kategorie</th>
        <th>Viral</th>
        <th>Thumbnail text</th>
      </tr>
    </thead>
    <tbody>
      ${videoRows}
    </tbody>
  </table>
</div>

<!-- ROADMAP -->
<div class="section page-break">
  <div class="section-title">🗺️ ${roadmap.weeks.length}-Týdenní Roadmapa</div>

  <div class="mono-box">
    <div class="mono-box-title">💰 Monetizační timeline</div>
    <div class="mono-box-text">${escHtml(roadmap.monetizationTimeline)}</div>
  </div>

  <div class="section-subtitle">🏆 Klíčové faktory úspěchu</div>
  <div class="success-grid" style="margin-bottom: 24px">
    ${roadmap.keySuccessFactors
      .map(
        (f) => `
    <div class="success-item"><span class="success-check">✓</span>${escHtml(f)}</div>`
      )
      .join("")}
  </div>

  <div class="section-subtitle">📅 Týdenní plán</div>
  ${weekCards}
</div>

<div class="footer">
  Video Factory AI · Channel Empire Blueprint · ${escHtml(niche)} · ${new Date().getFullYear()}
</div>

</body>
</html>`;
}

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
