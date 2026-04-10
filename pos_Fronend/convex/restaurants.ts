import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("restaurants"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      country: v.optional(v.string()),
      currency: v.optional(v.string()),
      currencySymbol: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("restaurants").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("restaurants"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      country: v.optional(v.string()),
      currency: v.optional(v.string()),
      currencySymbol: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const create = mutation({
  args: { 
    name: v.string(), 
    slug: v.string(),
    country: v.string(),
    currency: v.string(),
    currencySymbol: v.string(),
  },
  returns: v.id("restaurants"),
  handler: async (ctx, args) => {
    // Check if slug is unique
    const existing = await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      throw new Error("A restaurant with this slug already exists.");
    }

    const restaurantId = await ctx.db.insert("restaurants", {
      name: args.name,
      slug: args.slug,
      country: args.country,
      currency: args.currency,
      currencySymbol: args.currencySymbol,
    });

    // Seed some basic categories for every new restaurant
    const defaultCategories = ["Main Courses", "Starters", "Drinks"];
    for (let i = 0; i < defaultCategories.length; i++) {
      await ctx.db.insert("categories", {
        restaurantId,
        name: defaultCategories[i],
        order: i + 1,
      });
    }

    // Seed some basic tables
    for (let i = 1; i <= 5; i++) {
      await ctx.db.insert("tables", {
        restaurantId,
        number: i.toString(),
        capacity: 4,
        status: "available",
      });
    }

    return restaurantId;
  },
});
