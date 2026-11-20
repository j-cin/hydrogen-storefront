import type { ReactNode } from "react";

// Renders a Shopify `rich_text_field` value (a JSON string) as React elements.
// Building elements from the JSON tree, rather than HTML, keeps merchant content
// out of innerHTML.

type RichTextNode = {
  type: string;
  value?: string;
  bold?: boolean;
  italic?: boolean;
  level?: number;
  listType?: "ordered" | "unordered";
  url?: string;
  title?: string;
  target?: string;
  children?: RichTextNode[];
};

function parse(value: string | null | undefined): RichTextNode | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && "type" in parsed
      ? (parsed as RichTextNode)
      : null;
  } catch {
    return null;
  }
}

function isSafeUrl(url: string) {
  return url.startsWith("/") || /^https?:\/\//i.test(url) || /^mailto:/i.test(url);
}

function renderChildren(nodes: RichTextNode[] | undefined): ReactNode {
  return nodes?.map((node, index) => renderNode(node, index));
}

function renderNode(node: RichTextNode, key: number): ReactNode {
  switch (node.type) {
    case "root":
      return renderChildren(node.children);
    case "paragraph":
      return <p key={key}>{renderChildren(node.children)}</p>;
    case "heading": {
      // Merchant headings sit inside a section that already has its own heading.
      const level = Math.min(6, Math.max(3, (node.level ?? 2) + 1));
      const Tag = `h${level}` as "h3" | "h4" | "h5" | "h6";
      return <Tag key={key}>{renderChildren(node.children)}</Tag>;
    }
    case "list": {
      const Tag = node.listType === "ordered" ? "ol" : "ul";
      return <Tag key={key}>{renderChildren(node.children)}</Tag>;
    }
    case "list-item":
      return <li key={key}>{renderChildren(node.children)}</li>;
    case "link": {
      if (!node.url || !isSafeUrl(node.url)) return renderChildren(node.children);
      const external = node.target === "_blank";
      return (
        <a
          key={key}
          href={node.url}
          title={node.title}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {renderChildren(node.children)}
        </a>
      );
    }
    case "text": {
      let text: ReactNode = node.value ?? "";
      if (node.italic) text = <em>{text}</em>;
      if (node.bold) text = <strong>{text}</strong>;
      return <span key={key}>{text}</span>;
    }
    default:
      return renderChildren(node.children);
  }
}

export function RichText({ value, className }: { value?: string | null; className?: string }) {
  const root = parse(value);
  if (!root) return null;
  return <div className={className}>{renderNode(root, 0)}</div>;
}

/** Plain text of a rich text value, for meta descriptions and previews. */
export function richTextToPlainText(value: string | null | undefined): string {
  const collect = (node: RichTextNode): string =>
    node.type === "text" ? (node.value ?? "") : (node.children ?? []).map(collect).join(" ");
  const root = parse(value);
  return root ? collect(root).replace(/\s+/g, " ").trim() : "";
}
