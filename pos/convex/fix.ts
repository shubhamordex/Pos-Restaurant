import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const fixData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const restaurants = await ctx.db.query("restaurants").collect();
    for (const restaurant of restaurants) {
      if (!restaurant.country) {
        await ctx.db.patch(restaurant._id, {
          country: "United States",
          currency: "USD",
          currencySymbol: "$",
        } as any);
      }
    }
    return null;
  },
});
