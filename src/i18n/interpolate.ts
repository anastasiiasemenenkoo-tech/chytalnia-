/**
 * Replace `{name}` placeholders in a template with values from a vars
 * object. Tiny on purpose — runs in both server and client components.
 *
 * @example
 *   interpolate("Moved to \"{shelf}\"", { shelf: "Read" })
 *   // => 'Moved to "Read"'
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}
