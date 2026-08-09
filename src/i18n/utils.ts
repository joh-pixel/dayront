import type { AstroGlobal } from "astro";

export async function getTranslations(Astro: AstroGlobal, namespaces: string[] = ["translation"]) {
  const { t } = await import("astro-i18next");
  return t(Astro.locals as any, namespaces);
}