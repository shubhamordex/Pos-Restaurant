import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  returns: v.array(
    v.object({
      _id: v.id("menuItems"),
      _creationTime: v.number(),
      restaurantId: v.id("restaurants"),
      categoryId: v.id("categories"),
      name: v.string(),
      description: v.string(),
      price: v.number(),
      image: v.union(v.string(), v.null()),
      available: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("menuItems")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();
  },
});

export const create = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    image: v.union(v.string(), v.null()),
  },
  returns: v.id("menuItems"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("menuItems", {
      ...args,
      available: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("menuItems"),
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    image: v.union(v.string(), v.null()),
    available: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("menuItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
