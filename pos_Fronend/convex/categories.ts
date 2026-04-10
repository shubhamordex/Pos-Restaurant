import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      restaurantId: v.id("restaurants"),
      name: v.string(),
      order: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: { restaurantId: v.id("restaurants"), name: v.string() },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    const lastCategory = await ctx.db
      .query("categories")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .order("desc")
      .first();
    
    const order = lastCategory ? lastCategory.order + 1 : 1;

    return await ctx.db.insert("categories", {
      restaurantId: args.restaurantId,
      name: args.name,
      order,
    });
  },
});

export const update = mutation({
  args: { id: v.id("categories"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete all menu items in this category first
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .collect();
    
    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
