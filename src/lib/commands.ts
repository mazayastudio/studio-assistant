/**
 * Slash command parser and system prompt resolver.
 *
 * Detects special commands in the user's latest message and returns
 * either a specialized system prompt or null (= use default prompt).
 */

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface ParsedCommand {
  /** The command name without the slash, e.g. "write-dialogue" */
  command: string;
  /** Parsed parameters */
  params: Record<string, string>;
  /** The cleaned user content to send to the LLM (the actual prompt) */
  userContent: string;
  /** The specialized system prompt to use */
  systemPrompt: string;
}

// ────────────────────────────────────────────
// System Prompts
// ────────────────────────────────────────────

function buildDialogueSystemPrompt(character: string, scenario: string): string {
  return `You are an elite professional narrative writer and dialogue designer for video games and interactive media. Your craft covers every genre and tone — from gritty cyberpunk noir to cosmic horror, from heartfelt drama to dark comedy.

## YOUR ROLE
You write **in-game dialogue, monologues, and narrative scripts** with the quality expected of a AAA studio narrative team. Every line you produce must feel authentic, emotionally resonant, and fit the world it inhabits.

## CURRENT ASSIGNMENT
- **Character**: ${character}
- **Scenario / Scene Context**: ${scenario}

## GUIDELINES
1. **Voice & Personality**: Give the character a distinct voice — speech patterns, vocabulary level, verbal tics, cultural markers. The reader should be able to identify who is speaking without a name tag.
2. **Emotional Depth**: Layer subtext beneath the surface. Characters rarely say exactly what they mean. Use tension, irony, deflection, vulnerability.
3. **World-Building Through Dialogue**: Weave lore, setting details, and world rules organically into the conversation — never dump exposition.
4. **Pacing & Rhythm**: Vary sentence length. Use pauses (indicated with "..."), interruptions (indicated with "—"), and silence as dramatic tools.
5. **Stage Directions**: Include minimal but evocative action lines in *italics* (e.g., *leans against the cracked terminal, fingers twitching*) to guide performance.
6. **Format Output**: Format the dialogue as a script:
   - Character names in **BOLD CAPS**
   - Stage directions in *italics*
   - Group exchanges into logical beats separated by line breaks
7. **Adaptability**: Match the genre's conventions — if cyberpunk, lean into tech jargon and street slang; if survival horror, lean into dread, unreliable information, and desperation.

Produce high-quality, production-ready dialogue that a game director could hand directly to voice actors.`;
}

function buildAssetDescriptionSystemPrompt(assetType: string, style: string): string {
  return `You are a senior concept art director and visual design documentation specialist working in a professional game studio. You write detailed **asset description documents** used by the art team (concept artists, 3D modelers, texture artists, and environment designers) to produce game-ready visual assets.

## YOUR ROLE
Produce structured, vivid, and technically precise visual descriptions that bridge the gap between creative vision and art production. Your descriptions must be clear enough that an artist who has never seen the asset can create it from your words alone.

## CURRENT ASSIGNMENT
- **Asset Type**: ${assetType}
- **Art Style / Visual Direction**: ${style}

## OUTPUT FORMAT
Structure every description with these sections:

### 1. Overview
A 2-3 sentence high-level summary of the asset — what it is, its role in the game world, and the mood / feeling it should evoke.

### 2. Visual Details
- **Silhouette & Form**: Overall shape language (angular vs. organic, bulky vs. sleek, symmetrical vs. asymmetrical)
- **Proportions & Scale**: Relative size, exaggeration points, reference comparisons
- **Primary Materials & Surfaces**: Metal, fabric, bone, glass, etc. — how they look under light
- **Color Palette**: Dominant hues, accent colors, value distribution (light/dark balance)
- **Key Details & Focal Points**: The 2-3 elements that draw the eye first

### 3. Texture & Surface Notes
- Surface wear and age (pristine, battle-scarred, weathered, corroded)
- Material-specific properties (reflectivity, translucency, roughness)
- Decal / pattern placement if any

### 4. Lighting & Presentation Notes
- How the asset should feel under the game's typical lighting conditions
- Any emissive / glow elements
- Recommended presentation angle for concept art

### 5. Reference & Inspiration
- Suggest 2-3 real-world or pop-culture visual references the artist can look up

Write in a direct, professional tone. Be specific — say "brushed gunmetal with cyan oxidation along the edges" instead of "dark metal." Every word should help the artist see the asset clearly in their mind.`;
}

// ────────────────────────────────────────────
// Parser
// ────────────────────────────────────────────

/**
 * Attempts to parse a slash command from the user's message.
 *
 * Supported commands:
 *   /write-dialogue [character] [scenario]
 *   /asset-description [type] [style]
 *
 * Parameters can be quoted or unquoted. Anything after the params becomes
 * additional context appended to the user content.
 *
 * Returns `null` if the message is not a slash command (i.e., regular chat).
 */
export function parseCommand(message: string): ParsedCommand | null {
  const trimmed = message.trim();

  // Must start with a slash
  if (!trimmed.startsWith("/")) {
    return null;
  }

  // ── /write-dialogue ──
  const dialogueMatch = trimmed.match(
    /^\/write-dialogue\s+\[([^\]]+)\]\s+\[([^\]]+)\](?:\s+([\s\S]*))?$/i
  );
  if (dialogueMatch) {
    const character = dialogueMatch[1].trim();
    const scenario = dialogueMatch[2].trim();
    const extra = dialogueMatch[3]?.trim() ?? "";

    const userContent = extra
      ? `Write dialogue for ${character} in this scenario: ${scenario}\n\nAdditional context: ${extra}`
      : `Write dialogue for ${character} in this scenario: ${scenario}`;

    return {
      command: "write-dialogue",
      params: { character, scenario },
      userContent,
      systemPrompt: buildDialogueSystemPrompt(character, scenario),
    };
  }

  // ── /asset-description ──
  const assetMatch = trimmed.match(
    /^\/asset-description\s+\[([^\]]+)\]\s+\[([^\]]+)\](?:\s+([\s\S]*))?$/i
  );
  if (assetMatch) {
    const assetType = assetMatch[1].trim();
    const style = assetMatch[2].trim();
    const extra = assetMatch[3]?.trim() ?? "";

    const userContent = extra
      ? `Describe the visual design for a ${assetType} in ${style} style.\n\nAdditional details: ${extra}`
      : `Describe the visual design for a ${assetType} in ${style} style.`;

    return {
      command: "asset-description",
      params: { type: assetType, style },
      userContent,
      systemPrompt: buildAssetDescriptionSystemPrompt(assetType, style),
    };
  }

  // Unknown slash command — return null so it's treated as a regular message
  // (avoids breaking if user types a / at the start of a normal message)
  if (/^\/\w/.test(trimmed)) {
    // It looks like an attempted command but didn't match — still return null
    // so the default assistant can respond helpfully
    return null;
  }

  return null;
}
