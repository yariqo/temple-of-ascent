// Fonts are bundled (no external CDN at runtime) – only the Latin subsets we need.
import cinzel700 from '@fontsource/cinzel/files/cinzel-latin-700-normal.woff2?url';
import cinzel900 from '@fontsource/cinzel/files/cinzel-latin-900-normal.woff2?url';
import deco900 from '@fontsource/cinzel-decorative/files/cinzel-decorative-latin-900-normal.woff2?url';
import sans500 from '@fontsource/alegreya-sans/files/alegreya-sans-latin-500-normal.woff2?url';
import outfit600 from '@fontsource/outfit/files/outfit-latin-600-normal.woff2?url';
import outfit800 from '@fontsource/outfit/files/outfit-latin-800-normal.woff2?url';
import sans800 from '@fontsource/alegreya-sans/files/alegreya-sans-latin-800-normal.woff2?url';

const FACES: [string, string, string][] = [
  ['Cinzel', cinzel700, '700'],
  ['Cinzel', cinzel900, '900'],
  ['Cinzel Decorative', deco900, '900'],
  ['Alegreya Sans', sans500, '500'],
  ['Alegreya Sans', sans800, '800'],
  ['Outfit', outfit600, '600'],
  ['Outfit', outfit800, '800'],
];

export async function loadFonts(): Promise<void> {
  await Promise.all(
    FACES.map(async ([family, url, weight]) => {
      try {
        const f = new FontFace(family, `url(${url})`, { weight });
        await f.load();
        document.fonts.add(f);
      } catch {
        /* fall back to Georgia / system fonts */
      }
    }),
  );
}
