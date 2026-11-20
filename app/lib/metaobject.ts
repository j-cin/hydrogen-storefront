// Helpers for rendering metaobject fields read with `field(key: ...)` aliases.

/** Splits a multi_line_text_field value into paragraphs on blank lines. */
export function toParagraphs(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Splits a multi_line_text_field value into one item per non-empty line. */
export function toLines(value: string | null | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
