const { Region } = require('../../../models');
const { cacheData, invalidateCache } = require('../../../helpers/cache.helper');
const logger = require('../../../config/logger');
const ApiError = require('../../../helpers/api.error');

/**
 * Resolves the top-level parent region for a given region.
 * Walks up the parent_id chain until reaching a region with parent_id IS NULL.
 * 
 * @param {string} regionId - The region code to resolve (from regions.code)
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<string>} - The top-level region code
 * @throws {ApiError} - If region not found, loop detected, or parent chain broken
 * 
 * @example
 * // Top region
 * await resolveTopRegion('AHAL'); // Returns 'AHAL'
 * 
 * // Sub-region
 * await resolveTopRegion('ASGABAT_CITY'); // Returns 'AHAL' (if ASGABAT_CITY.parent_id = 'AHAL')
 * 
 * // Nested sub-region
 * await resolveTopRegion('DISTRICT_1'); // Returns 'AHAL' (walks up: DISTRICT_1 -> ASGABAT_CITY -> AHAL)
 */
async function resolveTopRegion(regionId, useCache = true) {
  if (!regionId) {
    throw new ApiError(400, 'Region ID is required');
  }

  const cacheKey = `region:top:${regionId}`;
  const cacheTTL = 3600; // 1 hour

  // Helper function to perform the actual resolution
  const resolve = async () => {
    const visited = new Set(); // Track visited regions to detect loops
    let currentRegionId = regionId;

    while (currentRegionId) {
      // Check for loops
      if (visited.has(currentRegionId)) {
        logger.error(`Region hierarchy loop detected: ${Array.from(visited).join(' -> ')} -> ${currentRegionId}`);
        throw new ApiError(500, `Region hierarchy loop detected for region: ${regionId}`);
      }

      visited.add(currentRegionId);

      // Fetch current region
      const region = await Region.findOne({
        where: { code: currentRegionId, is_active: true },
        attributes: ['code', 'parent_id'],
      });

      if (!region) {
        logger.error(`Region not found: ${currentRegionId}`);
        throw new ApiError(404, `Region not found: ${currentRegionId}`);
      }

      // If no parent, this is a top region
      if (!region.parent_id) {
        return region.code;
      }

      // Move up to parent
      currentRegionId = region.parent_id;
    }

    // Should never reach here, but handle edge case
    throw new ApiError(500, `Failed to resolve top region for: ${regionId}`);
  };

  // Use cache if enabled
  if (useCache) {
    return await cacheData(cacheKey, resolve, cacheTTL);
  }

  return await resolve();
}

/**
 * Invalidates the cache for a region's top region resolution.
 * Call this when region hierarchy changes.
 * 
 * @param {string} regionId - The region code to invalidate cache for
 */
async function invalidateTopRegionCache(regionId) {
  if (!regionId) {
    return;
  }

  const cacheKey = `region:top:${regionId}`;
  await invalidateCache(cacheKey);
  
  // Also invalidate cache for all child regions
  // This is a best-effort operation
  try {
    const { invalidateCachePattern } = require('../../../helpers/cache.helper');
    await invalidateCachePattern(`region:top:${regionId}*`);
  } catch (error) {
    logger.warn(`Failed to invalidate region cache pattern: ${error.message}`);
  }
}

/**
 * Query-optimized version using recursive CTE (PostgreSQL).
 * More efficient for deeply nested hierarchies.
 * 
 * @param {string} regionId - The region code to resolve
 * @returns {Promise<string>} - The top-level region code
 */
async function resolveTopRegionOptimized(regionId) {
  if (!regionId) {
    throw new ApiError(400, 'Region ID is required');
  }

  const { sequelize } = require('../../../models');
  const { QueryTypes } = require('sequelize');

  try {
    const result = await sequelize.query(
      `
      WITH RECURSIVE region_hierarchy AS (
        -- Base case: start with the given region
        SELECT code, parent_id, code as top_region, 0 as depth
        FROM regions
        WHERE code = :regionId AND is_active = true
        
        UNION ALL
        
        -- Recursive case: walk up the hierarchy
        SELECT r.code, r.parent_id, 
               CASE WHEN r.parent_id IS NULL THEN r.code ELSE rh.top_region END,
               rh.depth + 1
        FROM regions r
        INNER JOIN region_hierarchy rh ON r.code = rh.parent_id
        WHERE r.is_active = true
          AND rh.depth < 20  -- Safety limit to prevent infinite loops
      )
      SELECT DISTINCT top_region
      FROM region_hierarchy
      WHERE parent_id IS NULL
      LIMIT 1;
      `,
      {
        replacements: { regionId },
        type: QueryTypes.SELECT,
      }
    );

    if (!result || result.length === 0 || !result[0].top_region) {
      throw new ApiError(404, `Top region not found for: ${regionId}`);
    }

    return result[0].top_region;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error resolving top region (optimized): ${error.message}`);
    throw new ApiError(500, `Failed to resolve top region: ${error.message}`);
  }
}

module.exports = {
  resolveTopRegion,
  resolveTopRegionOptimized,
  invalidateTopRegionCache,
};

