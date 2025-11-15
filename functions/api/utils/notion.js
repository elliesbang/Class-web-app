import { Client } from "@notionhq/client";

let notionClient = null;

export function initNotion(env) {
  if (!env || !env.NOTION_TOKEN) {
    throw new Error("NOTION_TOKEN is not configured");
  }

  if (!notionClient) {
    notionClient = new Client({ auth: env.NOTION_TOKEN });
  }

  return notionClient;
}

function getClient() {
  if (!notionClient) {
    throw new Error("Notion client not initialized. Call initNotion(env) first.");
  }

  return notionClient;
}

export async function queryDB(databaseId, options = {}) {
  const client = getClient();
  return client.databases.query({ database_id: databaseId, ...options });
}

export async function createPage(databaseId, properties, options = {}) {
  const client = getClient();
  return client.pages.create({
    parent: { database_id: databaseId },
    properties,
    ...options,
  });
}

export async function updatePage(pageId, properties) {
  const client = getClient();
  return client.pages.update({ page_id: pageId, properties });
}

export function mapPageProperties(page) {
  if (!page || !page.properties) {
    return {};
  }

  const properties = {};

  Object.entries(page.properties).forEach(([key, value]) => {
    if (!value) {
      properties[key] = null;
      return;
    }

    switch (value.type) {
      case "title":
        properties[key] = value.title.map((item) => item.plain_text).join("");
        break;
      case "rich_text":
        properties[key] = value.rich_text.map((item) => item.plain_text).join("");
        break;
      case "number":
        properties[key] = value.number;
        break;
      case "checkbox":
        properties[key] = value.checkbox;
        break;
      case "select":
        properties[key] = value.select ? value.select.name : null;
        break;
      case "multi_select":
        properties[key] = value.multi_select.map((item) => item.name);
        break;
      case "date":
        properties[key] = value.date ? value.date.start : null;
        break;
      case "people":
        properties[key] = value.people.map((person) => person.name || person.id);
        break;
      case "email":
        properties[key] = value.email;
        break;
      case "url":
        properties[key] = value.url;
        break;
      case "phone_number":
        properties[key] = value.phone_number;
        break;
      case "files":
        properties[key] = value.files;
        break;
      case "formula":
        properties[key] = value.formula ? value.formula.string ?? value.formula.number ?? null : null;
        break;
      case "relation":
        properties[key] = value.relation.map((relation) => relation.id);
        break;
      default:
        properties[key] = value[value.type] ?? null;
    }
  });

  return { id: page.id, ...properties };
}
