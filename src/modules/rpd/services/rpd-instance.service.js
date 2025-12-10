const { RpdInstance, Region } = require('../../../models');
const { resolveTopRegion } = require('../../catalogs/services/region.service');
const { cacheData, invalidateCache } = require('../../../helpers/cache.helper');
const logger = require('../../../config/logger');
const ApiError = require('../../../helpers/api.error');
/**
 * Gets all RPD instances for a given region.
 * If the region is a sub-region, resolves to its top parent region first.
 * Returns all active RPD instances for that region (supports multi-audience).
 * 
 * @param {string} regionId - The region code (can be sub-region or top region)
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<Object>} - Object containing array of RPD instances with audiences array
 * @throws {ApiError} - If top region not found, or no active RPD instances found
 * 
 * @example
 * // For top region with single instance
 * const result = await getRpdInstanceByRegion('11');
 * // Returns: {
 * //   top_region_id: '11',
 * //   original_region_id: null,
 * //   instances: [{ id: 1, code: 'rpd_ahal', audience: 'rpd:ahal', ... }],
 * //   audiences: ['rpd:ahal']
 * // }
 * 
 * // For top region with multiple instances
 * const result = await getRpdInstanceByRegion('11');
 * // Returns: {
 * //   top_region_id: '11',
 * //   original_region_id: null,
 * //   instances: [
 * //     { id: 1, code: 'rpd_ahal_primary', audience: 'rpd:ahal:primary', ... },
 * //     { id: 2, code: 'rpd_ahal_secondary', audience: 'rpd:ahal:secondary', ... }
 * //   ],
 * //   audiences: ['rpd:ahal:primary', 'rpd:ahal:secondary']
 * // }
 * 
 * // For sub-region
 * const result = await getRpdInstanceByRegion('ASGABAT_CITY');
 * // Resolves to top region '11' and returns all its RPD instances
 */
async function getRpdInstanceByRegion(regionId, useCache = true) {
  if (!regionId) {
    throw new ApiError(400, 'Region ID is required');
  }

  const cacheKey = `rpd:instance:region:${regionId}`;
  const cacheTTL = 1800; // 30 minutes

  // Helper function to perform the actual lookup
  const lookup = async () => {
    // Step 1: Resolve to top region
    const topRegionId = await resolveTopRegion(regionId, useCache);
    
    // Step 2: Find ALL active RPD instances for top region
    const rpdInstances = await RpdInstance.findAll({
      where: {
        region_id: topRegionId,
        is_active: true,
      },
      include: [
        {
          model: Region,
          as: 'region',
          attributes: ['code', 'title_tm', 'title_ru'],
          required: false,
        },
      ],
      order: [['code', 'ASC']], // Consistent ordering
    });

    if (!rpdInstances || rpdInstances.length === 0) {
      logger.error(`No RPD instances found for top region: ${topRegionId} (original region: ${regionId})`);
      throw new ApiError(
        404,
        `No active RPD instances found for region: ${regionId}. No active RPD instances configured for top region: ${topRegionId}`
      );
    }

    // Extract audiences array
    const audiences = rpdInstances.map(inst => inst.audience);

    // Map instances to return format
    const instances = rpdInstances.map(rpdInstance => ({
      id: rpdInstance.id,
      code: rpdInstance.code,
      region_id: rpdInstance.region_id,
      audience: rpdInstance.audience,
      is_active: rpdInstance.is_active,
      region: rpdInstance.region ? {
        code: rpdInstance.region.code,
        title_tm: rpdInstance.region.title_tm,
        title_ru: rpdInstance.region.title_ru,
      } : null,
    }));

    return {
      top_region_id: topRegionId,
      original_region_id: regionId !== topRegionId ? regionId : null,
      instances: instances,
      audiences: audiences, // Array of all audiences for this region
    };
  };

  // Use cache if enabled
  if (useCache) {
    return await cacheData(cacheKey, lookup, cacheTTL);
  }

  return await lookup();
}

/**
 * Gets all active RPD instances.
 * 
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<Array>} - Array of active RPD instances
 */
async function getAllActiveRpdInstances(useCache = true) {
  const cacheKey = 'rpd:instances:all:active';
  const cacheTTL = 1800; // 30 minutes

  const fetch = async () => {
    const instances = await RpdInstance.findAll({
      where: { is_active: true },
      include: [
        {
          model: Region,
          as: 'region',
          attributes: ['code', 'title_tm', 'title_ru'],
          required: true,
        },
      ],
      order: [['code', 'ASC']],
    });

    return instances.map(instance => ({
      id: instance.id,
      code: instance.code,
      region_id: instance.region_id,
      audience: instance.audience,
      is_active: instance.is_active,
      region: instance.region ? {
        code: instance.region.code,
        title_tm: instance.region.title_tm,
        title_ru: instance.region.title_ru,
      } : null,
    }));
  };

  if (useCache) {
    return await cacheData(cacheKey, fetch, cacheTTL);
  }

  return await fetch();
}

/**
 * Gets an RPD instance by its code.
 * 
 * @param {string} code - The RPD instance code
 * @returns {Promise<Object>} - RPD instance object
 * @throws {ApiError} - If instance not found
 */
async function getRpdInstanceByCode(code) {
  if (!code) {
    throw new ApiError(400, 'RPD instance code is required');
  }

  const instance = await RpdInstance.findOne({
    where: { code, is_active: true },
    include: [
      {
        model: Region,
        as: 'region',
        attributes: ['code', 'title_tm', 'title_ru'],
        required: false,
      },
    ],
  });

  if (!instance) {
    throw new ApiError(404, `RPD instance not found: ${code}`);
  }

  return {
    id: instance.id,
    code: instance.code,
    region_id: instance.region_id,
    audience: instance.audience,
    is_active: instance.is_active,
    region: instance.region ? {
      code: instance.region.code,
      title_tm: instance.region.title_tm,
      title_ru: instance.region.title_ru,
    } : null,
  };
}

/**
 * Creates a new RPD instance.
 * Validates that region_id is a top region (parent_id IS NULL).
 * 
 * @param {Object} data - RPD instance data { code, region_id, audience, is_active? }
 * @returns {Promise<Object>} - Created RPD instance
 * @throws {ApiError} - If validation fails or instance already exists
 */
async function createRpdInstance(data) {
  const { code, region_id, audience, is_active = true } = data;

  // Validate required fields
  if (!code || !region_id || !audience) {
    throw new ApiError(400, 'code, region_id, and audience are required');
  }

  // Validate that region is a top region
  const region = await Region.findOne({
    where: { code: region_id, is_active: true },
    attributes: ['code', 'parent_id'],
  });

  if (!region) {
    throw new ApiError(404, `Region not found: ${region_id}`);
  }

  if (region.parent_id) {
    throw new ApiError(
      400,
      `Cannot create RPD instance for sub-region: ${region_id}. Only top regions (without parent_id) can have RPD instances.`
    );
  }

  // Check for duplicate code or audience
  const existingByCode = await RpdInstance.findOne({ where: { code } });
  if (existingByCode) {
    throw new ApiError(409, `RPD instance with code already exists: ${code}`);
  }

  const existingByAudience = await RpdInstance.findOne({ where: { audience } });
  if (existingByAudience) {
    throw new ApiError(409, `RPD instance with audience already exists: ${audience}`);
  }

  // Note: Multiple RPD instances per region are now allowed for multi-audience support
  // Removed the check that prevented multiple instances for the same region

  // Create instance
  const instance = await RpdInstance.create({
    code,
    region_id,
    audience,
    is_active,
  });

  // Invalidate cache
  await invalidateCache('rpd:instances:all:active');

  logger.info(`RPD instance created: ${code} for region ${region_id}`);

  return instance;
}

/**
 * Invalidates the cache for an RPD instance lookup.
 * Call this when RPD instance data changes.
 * 
 * @param {string} regionId - The region code to invalidate cache for
 */
async function invalidateRpdInstanceCache(regionId) {
  if (!regionId) {
    return;
  }

  await invalidateCache(`rpd:instance:region:${regionId}`);
  await invalidateCache('rpd:instances:all:active');
}

module.exports = {
  getRpdInstanceByRegion,
  getAllActiveRpdInstances,
  getRpdInstanceByCode,
  createRpdInstance,
  invalidateRpdInstanceCache,
};

