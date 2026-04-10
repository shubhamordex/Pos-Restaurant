import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  restaurants: defineTable({
    name: v.string(),
    slug: v.string(),
    country: v.optional(v.string()),
    currency: v.optional(v.string()),
    currencySymbol: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  categories: defineTable({
    restaurantId: v.id("restaurants"),
    name: v.string(),
    order: v.number(),
  }).index("by_restaurant", ["restaurantId"]),

  menuItems: defineTable({
    restaurantId: v.id("restaurants"),
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    image: v.union(v.string(), v.null()),
    available: v.boolean(),
  }).index("by_restaurant", ["restaurantId"])
    .index("by_category", ["categoryId"]),

  tables: defineTable({
    restaurantId: v.id("restaurants"),
    number: v.string(),
    capacity: v.number(),
    status: v.union(v.literal("available"), v.literal("occupied"), v.literal("reserved")),
  }).index("by_restaurant", ["restaurantId"]),

  orders: defineTable({
    restaurantId: v.id("restaurants"),
    tableId: v.id("tables"),
    status: v.union(v.literal("open"), v.literal("preparing"), v.literal("served"), v.literal("paid"), v.literal("cancelled")),
    items: v.array(v.object({
      menuItemId: v.id("menuItems"),
      quantity: v.number(),
      price: v.number(),
      notes: v.optional(v.string()),
    })),
    totalAmount: v.number(),
  }).index("by_restaurant", ["restaurantId"])
    .index("by_table", ["tableId"]),
});
