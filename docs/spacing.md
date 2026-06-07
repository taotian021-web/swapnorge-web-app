Spacing tokens and usage

Purpose
- Centralize page top padding and vertical spacing between top-level elements.
- Provide both CSS-variable-driven classes (for broad compatibility) and Tailwind tokens (for convenience).

Where things live
- CSS variables: `src/app/globals.css` (kept for reference and non-Tailwind usage)
- Tailwind tokens: `tailwind.config.ts`
  - spacing keys: `page-pt-sm`, `page-pt-md`, `page-pt-lg`, `page-space-sm`, `page-space-md`, `page-space-lg`

How to use

Recommended usage
- Preferred (recommended): use Tailwind tokens/classes for layout consistency and discoverability.

Examples:

```html
<!-- Page root with responsive top padding -->
<div className="pt-page-pt-sm sm:pt-page-pt-md lg:pt-page-pt-lg">
  <!-- Automatic vertical spacing between top-level sections -->
  <div className="space-y-page-space-sm sm:space-y-page-space-md md:space-y-page-space-lg">
    <header>...</header>
    <section>...</section>
    <footer>...</footer>
  </div>
</div>
```

Tailwind utility classes you can use directly:
- Top padding: `pt-page-pt-sm`, `pt-page-pt-md`, `pt-page-pt-lg`
- Vertical spacing: `space-y-page-space-sm`, `space-y-page-space-md`, `space-y-page-space-lg`

Examples:

```html
<div className="pt-page-pt-sm sm:pt-page-pt-md lg:pt-page-pt-lg">
  <div className="mt-page-space-md">...</div>
</div>
```

When to choose which
- Preferred (recommended): use Tailwind tokens/classes (`pt-page-pt-*`, `space-y-page-space-*`) for new code and layout components.
Legacy: `.page-top` and `.page-stack` were removed from `globals.css`. Use the Tailwind tokens above for replacements.

Changing values
- Quick tweak (recommended): edit the CSS variables in `src/app/globals.css` under the `:root` tokens (`--page-pt-*`, `--page-space-*`). This is instant and affects both CSS utilities.
- Tailwind token change: if you want the Tailwind tokens to reflect different raw values, update `tailwind.config.ts` spacing values and restart your dev server.

Notes
- After changing `tailwind.config.ts`, restart the Next.js dev server so Tailwind picks up the new classes.
- Both systems co-exist to support components that aren't using Tailwind classes yet.

Design rationale
- Use semantic classes for high-level layout consistency across the app.
- Provide Tailwind tokens for developers who prefer utility-first precise control.

