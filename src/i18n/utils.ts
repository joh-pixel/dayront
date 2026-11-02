import type { AstroGlobal } from "astro";

export async function getTranslations(Astro: AstroGlobal, namespaces: string[] = ["translation"]) {
  // @ts-ignore - astro-i18next has broken package.json exports for TypeScript
  const { t } = await import("astro-i18next");
  return t(Astro.locals as any, namespaces);
}