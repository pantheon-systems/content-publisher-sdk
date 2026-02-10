import { z } from "zod";

// From the googleapis package.
/**
 * Properties of a tab.
 */
export interface Schema$TabProperties {
  /**
   * The zero-based index of the tab within the parent.
   */
  index?: number | null;
  /**
   * Output only. The depth of the tab within the document. Root-level tabs start at 0.
   */
  nestingLevel?: number | null;
  /**
   * Optional. The ID of the parent tab. Empty when the current tab is a root-level tab, which means it doesn't have any parents.
   */
  parentTabId?: string | null;
  /**
   * Output only. The ID of the tab. This field can't be changed.
   */
  tabId?: string | null;
  /**
   * The user-visible name of the tab.
   */
  title?: string | null;
}

export type TabTree<T> = {
  documentTab?: T | undefined;
  childTabs?: TabTree<T>[] | undefined;
  tabProperties?: Schema$TabProperties | undefined;
};

export interface Article {
  resolvedContent:
    | string
    | PantheonTree
    | TabTree<PantheonTree | string | undefined | null>[]
    | null;
  renderAsTabs?: boolean | null;
  contentType: keyof typeof ContentType;
  id: string;
  slug?: string | null;
  tags: string[] | null;
  publishedDate: number | null;
  publishingLevel: keyof typeof PublishingLevel;
  title: string | null;
  updatedAt: number | null;
  metadata: Record<string, unknown> | null;
  previewActiveUntil: number | null;
  snippet?: string | null;
  site?: Site | null;
}

export type ArticleSummaryResponse = {
  articles: Omit<Article, "resolvedContent">[];
  summary: string;
};
export type PageInfo = {
  totalCount: number;
  nextCursor: string;
};
export type ArticleWithoutContent = Omit<Article, "resolvedContent">;
export type PaginatedArticle = {
  data: ArticleWithoutContent[];
  totalCount: number;
  cursor: string;
  fetchNextPage: () => Promise<PaginatedArticle>;
};

export enum PublishingLevel {
  PRODUCTION = "PRODUCTION",
  REALTIME = "REALTIME",
  DRAFT = "DRAFT",
}

export enum ContentType {
  TEXT_MARKDOWN = "TEXT_MARKDOWN",
  TREE_PANTHEON = "TREE_PANTHEON",
  TREE_PANTHEON_V2 = "TREE_PANTHEON_V2",
}

export enum ArticleSortField {
  createdAt = "createdAt",
  updatedAt = "updatedAt",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export interface Site {
  id: string;
  name: string;
  url: string;
  domain: string;
  tags: string[];
  contentStructure: Record<string, unknown> | null;
  metadataFields: Record<string, unknown>;
}

export interface TreePantheonContent {
  tag: string;
  attrs: {
    [key: string | "rowspan" | "colspan"]:
      | unknown
      | unknown[]
      | null
      | undefined;
  };
  children: TreePantheonContent[] | null | undefined;
  data?: string | null | undefined;
  style?: string[] | null | undefined;
  href?: string | null | undefined;
  alt?: string | null | undefined;
  title?: string | null | undefined;
  src?: string | null | undefined;
  type: string;
}

export interface TreePantheonContentSmartComponent extends TreePantheonContent {
  attributes: { [key: string]: string | null | boolean | number | unknown };
}

type Attrs = Record<string, string> & {
  colspan?: string;
  rowspan?: string;
  width?: string;
  height?: string;
  href?: string;
  src?: string;
  alt?: string;
  title?: string;
};

export interface PantheonTreeNode<T extends "component" | string = string> {
  tag: T;
  parentNode: PantheonTreeNode | null;
  prevNode: PantheonTreeNode | null;
  nextNode: PantheonTreeNode | null;
  children: PantheonTreeNode[] | null | undefined;
  data: string | null;
  style: string[] | null;
  attrs: Attrs;
  id?: string;
  type?: string;
}

export interface PantheonTree {
  version: string;
  children: PantheonTreeNode[];
}

interface MetadataGroupRowEssentials {
  label: string;
}

export interface MetadataGroup {
  label: string;
  groupIdentifier: string;
  schema?: Record<
    string,
    "string" | "textarea" | "number" | "boolean" | "date" | "file"
  >;
  get: (
    id: string,
  ) =>
    | Promise<(unknown & MetadataGroupRowEssentials) | null | undefined>
    | (unknown & MetadataGroupRowEssentials)
    | null
    | undefined;
  list: () =>
    | Promise<(unknown & MetadataGroupRowEssentials)[] | null | undefined>
    | (unknown & MetadataGroupRowEssentials)[]
    | null
    | undefined;
}

const fieldTypes = z.enum([
  "string",
  "textarea",
  "number",
  "boolean",
  "date",
  "file",
]);

const baseFieldSchema = z.object({
  type: fieldTypes,
  displayName: z.string(),
  required: z.boolean(),
  defaultValue: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.string()),
      z.array(z.number()),
      z.array(z.boolean()),
    ])
    .optional(),
  multiple: z.boolean().optional(),
});

const optionsSchema = z.array(
  z.union([
    z.string(),
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ]),
);

const enumFieldSchema = baseFieldSchema.merge(
  z.object({
    type: z.literal("enum"),
    options: z.union([optionsSchema, optionsSchema.readonly()]),
  }),
);

const objectFieldSchema = baseFieldSchema.merge(
  z.object({
    type: z.literal("object"),
    fields: z.union([
      z.record(z.string(), baseFieldSchema),
      z.record(z.string(), baseFieldSchema).readonly(),
    ]),
  }),
);

const fieldSchema = z.discriminatedUnion("type", [
  baseFieldSchema,
  enumFieldSchema,
  objectFieldSchema,
]);

export const SmartComponentMapZod = z.record(
  z.string(),
  z.object({
    title: z.string(),
    variants: z.array(z.string()).optional(),
    iconUrl: z.string().nullable().optional(),
    exampleImageUrl: z
      .string()
      .nullable()
      .optional()
      .or(z.array(z.string()).optional()),
    fields: z.record(z.string(), fieldSchema),
  }),
);

export type SmartComponentMap = z.infer<typeof SmartComponentMapZod>;

/**
 * Infers properties for a smart component based on field definitions.
 */
export type InferSmartComponentProps<
  T extends SmartComponentMap[keyof SmartComponentMap],
> = Optional<
  {
    [K in keyof T["fields"]]: InferFieldProps<T["fields"][K]>;
  },
  OptionalFields<T["fields"]>
>;

// Utility type to make certain keys of a type optional.
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

// Extracts keys that represent optional fields in a record.
type OptionalFields<T> = {
  [K in keyof T]: T[K] extends { required: false } ? K : never;
}[keyof T];

// Generic type for a field in a smart component.
type SmartComponentMapField =
  SmartComponentMap[keyof SmartComponentMap]["fields"][keyof SmartComponentMap[keyof SmartComponentMap]["fields"]];

// Infers TypeScript type for a field based on its type definition.
type InferFieldProps<T extends SmartComponentMapField> = T extends {
  type: "enum";
  options: infer O;
}
  ? O extends readonly { value: infer V }[]
    ? V
    : O extends readonly string[]
      ? O[number]
      : unknown
  : T extends { type: "number" }
    ? number
    : T extends { type: "boolean" }
      ? boolean
      : T extends { type: "string" | "file" | "date" }
        ? string
        : T extends {
              type: "object";
              fields: Record<string, unknown>;
            }
          ? T["multiple"] extends true
            ? Optional<
                { [K in keyof T["fields"]]: InferFieldProps<T["fields"][K]> },
                OptionalFields<T["fields"]>
              >[]
            : Optional<
                { [K in keyof T["fields"]]: InferFieldProps<T["fields"][K]> },
                OptionalFields<T["fields"]>
              >
          : unknown;
