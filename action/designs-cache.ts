"use server";

import { Redis } from "@upstash/redis";
import { getDesigns } from "@/action/designs";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

// Cache key for hero section designs
const HERO_DESIGNS_CACHE_KEY = "hero:designs";

// Time to live in seconds (1 hour)
const CACHE_TTL = 60 * 60;

// Types for cached design data - UPDATED: Changed firstImage to images array
export interface CachedDesign {
  design_id: string;
  name: string;
  images: string[]; // CHANGED: Now stores all images instead of just firstImage
  category: string;
  price: number;
  description: string; // ADDED: Include description since HeroSection uses it
}

// Server action to get designs with Redis caching
export async function getHeroDesigns(): Promise<CachedDesign[]> {
  try {
    // Try to get from cache first
    const cached = await redis.get<CachedDesign[]>(HERO_DESIGNS_CACHE_KEY);

    console.log("Retrieved from Redis cache:", {
      hasData: !!cached,
      type: typeof cached,
      isArray: Array.isArray(cached),
    });

    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log("Returning cached designs, count:", cached.length);
      return cached;
    }

    // If not in cache, fetch from database
    console.log("Cache miss, fetching from database...");
    const result = await getDesigns();

    if (!result.success || !result.designs) {
      console.error("Failed to fetch designs:", result.error);
      return [];
    }

    console.log("Fetched designs from database, count:", result.designs.length);

    // Transform data for hero section - now includes all images
    const heroDesigns: CachedDesign[] = result.designs
      .filter((design) => design.images && design.images.length > 0) // Only designs with images
      .map((design) => ({
        design_id: design.design_id,
        name: design.name,
        images: design.images || [], // CHANGED: Store all images
        category: design.category,
        price: design.price,
        description: design.description || "", // ADDED: Include description
      }))
      .slice(0, 10); // Limit to 10 designs for hero section

    console.log("Transformed hero designs, count:", heroDesigns.length);

    if (heroDesigns.length > 0) {
      // Store in Redis cache - Redis will automatically serialize the array
      await redis.set(HERO_DESIGNS_CACHE_KEY, heroDesigns, {
        ex: CACHE_TTL,
      });
      console.log("Stored designs in Redis cache");
    }

    return heroDesigns;
  } catch (error) {
    console.error("Error in getHeroDesigns:", error);
    return [];
  }
}

// Server action to clear the hero designs cache
export async function clearHeroDesignsCache(): Promise<{ success: boolean }> {
  try {
    await redis.del(HERO_DESIGNS_CACHE_KEY);
    console.log("Cleared hero designs cache from Redis");
    return { success: true };
  } catch (error) {
    console.error("Error clearing cache:", error);
    return { success: false };
  }
}

// Server action to refresh cache (can be called after design updates)
export async function refreshHeroDesignsCache(): Promise<{
  success: boolean;
  count: number;
}> {
  try {
    const result = await getDesigns();

    if (!result.success || !result.designs) {
      console.error("Failed to fetch designs for refresh");
      return { success: false, count: 0 };
    }

    const heroDesigns: CachedDesign[] = result.designs
      .filter((design) => design.images && design.images.length > 0)
      .map((design) => ({
        design_id: design.design_id,
        name: design.name,
        images: design.images || [], // CHANGED: Store all images
        category: design.category,
        price: design.price,
        description: design.description || "", // ADDED: Include description
      }))
      .slice(0, 10);

    console.log("Refreshing cache with", heroDesigns.length, "designs");

    if (heroDesigns.length > 0) {
      await redis.set(HERO_DESIGNS_CACHE_KEY, heroDesigns, {
        ex: CACHE_TTL,
      });
      console.log("Refreshed hero designs cache in Redis");
    } else {
      // If no designs, clear the cache
      await redis.del(HERO_DESIGNS_CACHE_KEY);
      console.log("No designs to cache, cleared existing cache");
    }

    return { success: true, count: heroDesigns.length };
  } catch (error) {
    console.error("Error refreshing cache:", error);
    return { success: false, count: 0 };
  }
}

// Utility function to check cache status
export async function getHeroDesignsCacheStatus(): Promise<{
  hasCache: boolean;
  count?: number;
  ttl?: number;
}> {
  try {
    // Check if key exists and get TTL
    const exists = await redis.exists(HERO_DESIGNS_CACHE_KEY);

    if (!exists) {
      return { hasCache: false };
    }

    const designs = await redis.get<CachedDesign[]>(HERO_DESIGNS_CACHE_KEY);
    const ttl = await redis.ttl(HERO_DESIGNS_CACHE_KEY);

    return {
      hasCache: true,
      count: Array.isArray(designs) ? designs.length : 0,
      ttl: ttl > 0 ? ttl : 0,
    };
  } catch (error) {
    console.error("Error getting cache status:", error);
    return { hasCache: false };
  }
}
