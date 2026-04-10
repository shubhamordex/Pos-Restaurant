import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  returns: v.array(
    v.object({
      _id: v.id("tables"),
      _creationTime: v.number(),
      restaurantId: v.id("restaurants"),
      number: v.string(),
      capacity: v.number(),
      status: v.union(v.literal("available"), v.literal("occupied"), v.literal("reserved")),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tables")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tables"),
    status: v.union(v.literal("available"), v.literal("occupied"), v.literal("reserved")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});

export const create = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    number: v.string(),
    capacity: v.number(),
  },
  returns: v.id("tables"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("tables", {
      ...args,
      status: "available",
    });
  },
});

export const remove = mutation({
  args: { id: v.id("tables") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
