import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seed = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if we already have data
    const existing = await ctx.db.query("restaurants").first();
    if (existing) return null;

    const restaurantId = await ctx.db.insert("restaurants", {
      name: "The Gourmet Bistro",
      slug: "gourmet-bistro",
      country: "United States",
      currency: "USD",
      currencySymbol: "$",
    });

    const categories = [
      { name: "Appetizers", order: 1 },
      { name: "Main Courses", order: 2 },
      { name: "Desserts", order: 3 },
      { name: "Beverages", order: 4 },
    ];

    const categoryIds: Record<string, any> = {};
    for (const cat of categories) {
      const id = await ctx.db.insert("categories", {
        restaurantId,
        name: cat.name,
        order: cat.order,
      });
      categoryIds[cat.name] = id;
    }

    const menuItems = [
      {
        name: "Garlic Bread",
        description: "Toasted baguette with garlic butter and herbs",
        price: 6.5,
        categoryId: categoryIds["Appetizers"],
        available: true,
      },
      {
        name: "Bruschetta",
        description: "Tomato, basil, and balsamic glaze on crostini",
        price: 8.0,
        categoryId: categoryIds["Appetizers"],
        available: true,
      },
      {
        name: "Grilled Salmon",
        description: "Fresh Atlantic salmon with roasted vegetables",
        price: 24.5,
        categoryId: categoryIds["Main Courses"],
        available: true,
      },
      {
        name: "Ribeye Steak",
        description: "12oz grass-fed ribeye with mashed potatoes",
        price: 32.0,
        categoryId: categoryIds["Main Courses"],
        available: true,
      },
      {
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with a molten center",
        price: 9.5,
        categoryId: categoryIds["Desserts"],
        available: true,
      },
      {
        name: "Tiramisu",
        description: "Classic Italian coffee-flavored dessert",
        price: 8.5,
        categoryId: categoryIds["Desserts"],
        available: true,
      },
      {
        name: "Red Wine",
        description: "House Cabernet Sauvignon",
        price: 12.0,
        categoryId: categoryIds["Beverages"],
        available: true,
      },
      {
        name: "Fresh Lemonade",
        description: "House-made with real lemons",
        price: 4.5,
        categoryId: categoryIds["Beverages"],
        available: true,
      },
    ];

    for (const item of menuItems) {
      await ctx.db.insert("menuItems", {
        restaurantId,
        image: null,
        ...item,
      });
    }

    const tables = [
      { number: "1", capacity: 2, status: "available" },
      { number: "2", capacity: 2, status: "available" },
      { number: "3", capacity: 4, status: "available" },
      { number: "4", capacity: 4, status: "available" },
      { number: "5", capacity: 6, status: "available" },
      { number: "VIP 1", capacity: 8, status: "available" },
    ];

    for (const table of tables) {
      await ctx.db.insert("tables", {
        restaurantId,
        ...table as any,
      });
    }

    return null;
  },
});
