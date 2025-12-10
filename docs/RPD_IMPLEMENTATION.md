# RPD Instance Implementation - Option 1

## Overview

This implementation follows "Option 1" design pattern where:
- RPD instances are created ONLY for top-level regions (6 top regions + 1 capital = 7 instances)
- Sub-regions automatically use their parent region's RPD instance
- Token audience is set based on the resolved top region's RPD instance
- Cross-region token misuse is prevented through audience validation

## Architecture

```
User (region_id: ASGABAT_CITY, parent: AHAL)
  ↓
resolveTopRegion() → AHAL (top region)
  ↓
getRpdInstanceByRegion() → RPD Instance (audience: "rpd:ahal")
  ↓
issueAccessToken() → JWT with aud="rpd:ahal", region_id="AHAL", sub_region_id="ASGABAT_CITY"
  ↓
RPD Deployment validates aud matches RPD_AUDIENCE="rpd:ahal" ✓
```

## Files Created/Modified

### 1. Data Model

**File:** `src/models/RpdInstance.js`
- Sequelize model for `rpd_instances` table
- Fields: `id`, `code`, `region_id` (FK to regions), `audience` (unique), `is_active`

**File:** `src/migrations/20250101000024-create-rpd-instances.js`
- Migration to create `rpd_instances` table
- Indexes on `code`, `audience`, `region_id`, `is_active`

### 2. Services

**File:** `src/modules/regions/services/region.service.js`
- `resolveTopRegion(regionId, useCache)` - Walks up parent_id chain to find top region
- `resolveTopRegionOptimized(regionId)` - PostgreSQL recursive CTE version
- `invalidateTopRegionCache(regionId)` - Cache invalidation helper
- Includes loop detection and error handling

**File:** `src/modules/rpd/services/rpd-instance.service.js`
- `getRpdInstanceByRegion(regionId, useCache)` - Gets RPD instance for a region (resolves to top)
- `getAllActiveRpdInstances(useCache)` - Lists all active instances
- `getRpdInstanceByCode(code)` - Gets instance by code
- `createRpdInstance(data)` - Creates new instance (validates top region)
- `invalidateRpdInstanceCache(regionId)` - Cache invalidation

**File:** `src/modules/security/tokens/token.service.js` (modified)
- Added `issueAccessToken(user, userType, options)` - Issues RPD tokens with correct audience
- Automatically resolves region hierarchy
- Sets JWT claims: `sub`, `role_id`, `region_id` (top), `sub_region_id` (if sub-region), `aud` (RPD audience)

### 3. Models Index

**File:** `src/models/index.js` (modified)
- Added RpdInstance model
- Added associations: RpdInstance.belongsTo(Region), Region.hasOne(RpdInstance)

### 4. Examples

**File:** `src/examples/rpd-verification.middleware.js`
- Express middleware for RPD deployments to verify tokens
- Validates signature, issuer, expiration, and **audience**
- Prevents cross-region token misuse

**File:** `src/examples/auth-login-rpd.example.js`
- Example login functions using `issueAccessToken()`
- Shows Member and Client login with RPD tokens

## Token Payload Examples

### Top Region User
```json
{
  "iss": "AUTHRPD",
  "sub": "MEMBER:123",
  "aud": "rpd:ahal",
  "iat": 1704067200,
  "exp": 1704068400,
  "jti": "550e8400-e29b-41d4-a716-446655440000",
  "role_id": 5,
  "region_id": "AHAL"
}
```

### Sub-Region User
```json
{
  "iss": "AUTHRPD",
  "sub": "MEMBER:456",
  "aud": "rpd:ahal",
  "iat": 1704067200,
  "exp": 1704068400,
  "jti": "550e8400-e29b-41d4-a716-446655440001",
  "role_id": 5,
  "region_id": "AHAL",
  "sub_region_id": "ASGABAT_CITY"
}
```

## Security Model

### How Cross-Region Prevention Works

1. **Token Issuance (AuthRPD)**
   - User logs in with `region_id = "ASGABAT_CITY"`
   - System resolves to top region: `AHAL`
   - Gets RPD instance: `audience = "rpd:ahal"`
   - Token issued with `aud = "rpd:ahal"`

2. **Token Verification (RPD Deployment)**
   - RPD instance expects `RPD_AUDIENCE = "rpd:ahal"`
   - Middleware validates `token.aud === RPD_AUDIENCE`
   - If mismatch → 403 Forbidden
   - Prevents user from one region accessing another region's RPD

3. **Example Attack Prevention**
   - User from AHAL region gets token with `aud="rpd:ahal"`
   - Tries to use it on BALKAN RPD (`RPD_AUDIENCE="rpd:balkan"`)
   - Middleware rejects: `aud="rpd:ahal" !== "rpd:balkan"`
   - **Result:** Cross-region access blocked ✓

## Usage

### 1. Run Migration
```bash
npm run migrate
```

### 2. Create RPD Instances (via admin API or directly in DB)
```javascript
const { createRpdInstance } = require('./modules/rpd/services/rpd-instance.service');

await createRpdInstance({
  code: 'rpd_ahal',
  region_id: 'AHAL',  // Must be a top region (parent_id IS NULL)
  audience: 'rpd:ahal',
  is_active: true
});
```

### 3. Use in Login
```javascript
const { issueAccessToken } = require('./modules/security/tokens/token.service');

const token = await issueAccessToken({
  id: user.id,
  role_id: user.role_id,
  region_id: user.region_id  // Can be sub-region, will auto-resolve
}, 'MEMBER');
```

### 4. Verify in RPD Deployment
```javascript
const { verifyRpdToken } = require('./middlewares/rpd-verification.middleware');

app.get('/api/protected', verifyRpdToken, (req, res) => {
  // req.user contains decoded token
  console.log(req.user.region_id);  // Top region
  console.log(req.user.sub_region_id);  // Original region if sub-region
});
```

## Caching

All services use Redis caching with appropriate TTLs:
- Region resolution: 1 hour TTL
- RPD instance lookups: 30 minutes TTL
- Cache keys: `region:top:{regionId}`, `rpd:instance:region:{regionId}`

Cache invalidation helpers are provided for when data changes.

## Performance Considerations

1. **Region Resolution**
   - Standard version: Iterative with loop detection (safe, simple)
   - Optimized version: PostgreSQL recursive CTE (faster for deep hierarchies)
   - Both are cached

2. **RPD Instance Lookup**
   - Single query with join to regions table
   - Cached per region_id

3. **Token Issuance**
   - 2 database queries (region resolution + RPD lookup) but both cached
   - JWT signing is fast (RS256)

## Constraints & Validation

- RPD instances can ONLY be created for top regions (parent_id IS NULL)
- Each top region can have at most one RPD instance
- Audience must be unique across all instances
- Region code must be unique
- Validation happens at application level in `createRpdInstance()`

## Testing Recommendations

1. Test region resolution with various hierarchies
2. Test loop detection (malformed data)
3. Test token issuance for top and sub-regions
4. Test audience validation in RPD middleware
5. Test cache invalidation
6. Test cross-region token rejection

## Future Enhancements

- Add database constraint for top-region-only (PostgreSQL check constraint)
- Add RPD instance management API endpoints
- Add monitoring/metrics for region resolution performance
- Consider materialized view for region hierarchy if performance becomes an issue

