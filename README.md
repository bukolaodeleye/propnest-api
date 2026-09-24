# PropNest API
PropNest API is a versioned public REST API for a property marketplace containing:
* Agents
* Properties
* Property viewing requests

The REST API is the primary product.

Technology stack:
* Node.js
* TypeScript
* Express
* PostgreSQL
* Prisma ORM
* Zod
* Faker

### Local development
Current API base URL conceptually:
`http://localhost:3000/api/v1`

### Production
`Production URL: Pending deployment (Deployment in progress...)`

## Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/bukolaodeleye/propnest-api.git
   cd propnest-api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   Copy `.env.example` to `.env` and adjust variables if needed.
4. Start local Prisma Postgres development database:
   ```bash
   npx prisma dev --name propnest
   ```
5. Run migrations:
   ```bash
   npx prisma migrate dev
   ```
6. Generate Prisma client (if not done automatically):
   ```bash
   npx prisma generate
   ```
7. Seed development data:
   ```bash
   npm run db:seed
   ```
8. Start the application:
   ```bash
   npm run dev
   ```

Useful scripts:
* `npm run dev` - Starts the development server with hot-reload
* `npm run build` - Compiles TypeScript to JavaScript
* `npm run start` - Runs the compiled production code
* `npm run typecheck` - Verifies TypeScript types without compiling
* `npm run db:seed` - Seeds the database with development data
* `npm run db:smoke` - Verifies database connectivity and record counts
* `npm run test:api` - Runs the read and write verification suite
* `npm run test:rate-limit` - Verifies rate limiting behavior

## Environment Variables
* `PORT`: integer (optional locally, default: 3000)
* `DATABASE_URL`: PostgreSQL connection string (required for database operations, e.g. `postgresql://user:password@localhost:5432/db`)
* `SHADOW_DATABASE_URL`: used for Prisma development migrations where applicable (e.g. `postgresql://user:password@localhost:5432/shadow_db`)

## API Conventions
* **Base Path:** `/api/v1`
* **Identifiers:** UUID
* **Content type for write requests:** `application/json`
* **Property monetary representation:** Property prices are returned as decimal-compatible JSON strings (e.g., `"price": "85000000"`). This preserves exact monetary values and clients may format the value for display.

## Response Envelopes
The same top-level conventions are used consistently across all endpoints.

### Collection Response
```json
{
  "data": [],
  "meta": {
    "total": 900,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Single-Resource Response
```json
{
  "data": {}
}
```

### Error Response
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Property not found"
  }
}
```

## Pagination
Collection endpoints are paginated using `limit` and `offset` query parameters.

* `limit`: integer, default 20, maximum 100. Values above 100 are clamped to 100.
* `offset`: integer, default 0, must be >= 0.

This implementation uses **offset pagination**, implemented at database level using Prisma `skip` + `take`.
* **Advantages:** simple for consumers, easy page navigation.
* **Tradeoffs:** large offsets can become slower, changing data may shift results between pages.
Cursor pagination would be preferable for very large or rapidly changing datasets.

## Endpoints

### System

#### `GET /api/v1/health`
**Purpose:** Verify the API is running.
**Parameters:** None
**Example Request:**
```bash
curl http://localhost:3000/api/v1/health
```
**Example Response (200 OK):**
```json
{
  "data": {
    "status": "ok",
    "service": "PropNest API"
  }
}
```

### Agents

#### `GET /api/v1/agents`
**Purpose:** Retrieve a paginated list of agents.
**Query Parameters:**
* `limit` (integer, optional, default: 20)
* `offset` (integer, optional, default: 0)
* `city` (string, optional)
* `agencyName` (string, optional)
* `sort` (string, optional, allowed: name, agencyName, city, createdAt, default: createdAt)
* `order` (string, optional, allowed: asc, desc, default: desc)

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/agents?city=Lagos&limit=5"
```
**Example Response (200 OK):**
```json
{
  "data": [
    {
      "id": "e7b9...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "agencyName": "Prime Real Estate",
      "city": "Lagos",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": {
    "total": 15,
    "limit": 5,
    "offset": 0,
    "hasMore": true
  }
}
```
**Important Expected Errors:**
* `400 Bad Request` - Invalid query parameter, invalid sort field

#### `GET /api/v1/agents/:id`
**Purpose:** Retrieve a single agent by ID.
**Path Parameters:**
* `id` (UUID, required)

**Example Request:**
```bash
curl http://localhost:3000/api/v1/agents/e7b9...
```
**Example Response (200 OK):**
```json
{
  "data": {
    "id": "e7b9...",
    "name": "Jane Doe"
  }
}
```
**Important Expected Errors:**
* `400 Bad Request` - Malformed UUID
* `404 Not Found` - Valid missing UUID

#### `GET /api/v1/agents/:id/properties`
**Purpose:** Retrieve properties owned by a specific agent.
**Path Parameters:**
* `id` (UUID, required) - The agent's ID

**Query Parameters:**
* `limit`, `offset` (pagination)
* `city` (string, optional)
* `state` (string, optional)
* `propertyType` (enum, optional, allowed: apartment, house, duplex, land, commercial)
* `listingType` (enum, optional, allowed: rent, sale)
* `status` (enum, optional, allowed: available, unavailable)
* `bedrooms` (integer, optional)
* `minPrice`, `maxPrice` (decimal/number, optional)
* `sort` (string, optional, allowed: price, createdAt, bedrooms, bathrooms, city, default: createdAt)
* `order` (string, optional, allowed: asc, desc, default: desc)

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/agents/e7b9.../properties?listingType=sale"
```
**Example Response (200 OK):**
```json
{
  "data": [
    {
      "id": "a1b2...",
      "title": "Luxury Villa"
    }
  ],
  "meta": { "total": 10, "limit": 20, "offset": 0, "hasMore": false }
}
```
**Important Expected Errors:**
* `400 Bad Request` - Malformed UUID, invalid query
* `404 Not Found` - Valid missing agent UUID

### Properties

#### `GET /api/v1/properties`
**Purpose:** Retrieve a paginated list of properties.
**Query Parameters:**
* `limit` (integer, optional, default: 20)
* `offset` (integer, optional, default: 0)
* `city`, `state` (string, optional)
* `propertyType` (enum, optional, allowed: apartment, house, duplex, land, commercial)
* `listingType` (enum, optional, allowed: rent, sale)
* `status` (enum, optional, allowed: available, unavailable)
* `bedrooms` (integer, optional)
* `minPrice`, `maxPrice` (decimal/number, optional)
* `sort` (string, optional, allowed: price, createdAt, bedrooms, bathrooms, city, default: createdAt)
* `order` (string, optional, allowed: asc, desc, default: desc)

**Example Requests:**
Filtering:
```bash
curl "http://localhost:3000/api/v1/properties?city=Lagos&listingType=sale"
```
Price range:
```bash
curl "http://localhost:3000/api/v1/properties?minPrice=10000000&maxPrice=100000000"
```
Sorting:
```bash
curl "http://localhost:3000/api/v1/properties?sort=price&order=desc&limit=10"
```
**Example Response (200 OK):**
```json
{
  "data": [
    {
      "id": "a1b2...",
      "title": "Luxury Villa",
      "price": "85000000"
    }
  ],
  "meta": { "total": 10, "limit": 20, "offset": 0, "hasMore": false }
}
```
**Important Expected Errors:**
* `400 Bad Request` - Invalid query parameter

#### `GET /api/v1/properties/:id`
**Purpose:** Retrieve a single property by ID.
**Path Parameters:**
* `id` (UUID, required)

**Example Request:**
```bash
curl http://localhost:3000/api/v1/properties/a1b2...
```
**Example Response (200 OK):**
```json
{
  "data": {
    "id": "a1b2...",
    "title": "Luxury Villa",
    "price": "85000000",
    "agent": {
      "id": "e7b9...",
      "name": "Jane Doe"
    }
  }
}
```
*Note: Includes Agent relationship in successful response.*
**Important Expected Errors:**
* `400 Bad Request` - Malformed UUID
* `404 Not Found` - Valid missing UUID

### Viewings

#### `GET /api/v1/viewings`
**Purpose:** Retrieve a paginated list of viewings.
**Query Parameters:**
* `limit`, `offset` (pagination)
* `status` (enum, optional, allowed: pending, confirmed, completed, cancelled)
* `propertyId` (UUID, optional)
* `from`, `to` (date/datetime, optional)
* `sort` (string, optional, allowed: scheduledAt, createdAt, status, default: scheduledAt)
* `order` (string, optional, allowed: asc, desc, default: desc)

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/viewings?status=pending"
```
**Example Response (200 OK):**
```json
{
  "data": [
    {
      "id": "c3d4...",
      "status": "pending"
    }
  ],
  "meta": { "total": 10, "limit": 20, "offset": 0, "hasMore": false }
}
```
**Important Expected Errors:**
* `400 Bad Request` - Invalid query parameter

#### `GET /api/v1/viewings/:id`
**Purpose:** Retrieve a single viewing by ID.
**Path Parameters:**
* `id` (UUID, required)

**Example Request:**
```bash
curl http://localhost:3000/api/v1/viewings/c3d4...
```
**Example Response (200 OK):**
```json
{
  "data": {
    "id": "c3d4...",
    "status": "pending"
  }
}
```
**Important Expected Errors:**
* `400 Bad Request` - Malformed UUID
* `404 Not Found` - Valid missing UUID

#### `POST /api/v1/viewings`
**Purpose:** Create a new viewing request.
**Required Body Fields:**
* `propertyId`: UUID
* `customerName`: string
* `customerEmail`: valid email
* `customerPhone`: string
* `scheduledAt`: ISO datetime
**Optional Body Fields:**
* `status`: (enum, allowed: pending, confirmed, completed, cancelled. Default: pending)

*(The server owns id, createdAt, and updatedAt)*

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/viewings \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"a1b2...","customerName":"Ada Okafor","customerEmail":"ada@example.com","customerPhone":"+2348012345678","scheduledAt":"2026-10-10T10:00:00.000Z"}'
```
**Example Success (201 Created):**
```json
{
  "data": {
    "id": "new-uuid",
    "status": "pending"
  }
}
```
**Example Error (422 Unprocessable Entity - missing field):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "customerEmail Invalid input: expected string, received undefined"
  }
}
```
**Other Expected Errors:**
* `400 Bad Request` - Malformed JSON

#### `PATCH /api/v1/viewings/:id`
**Purpose:** Partially update an existing viewing request.
**Path Parameters:**
* `id` (UUID, required)
**Mutable Fields (all optional, but at least one must be provided):**
* `propertyId`
* `customerName`
* `customerEmail`
* `customerPhone`
* `scheduledAt`
* `status`

**Example Request:**
```bash
curl -X PATCH http://localhost:3000/api/v1/viewings/c3d4... \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'
```
**Example Success (200 OK):**
```json
{
  "data": {
    "id": "c3d4...",
    "status": "confirmed"
  }
}
```
**Important Expected Errors:**
* `422 Unprocessable Entity` - Empty body, or invalid referenced Property
* `400 Bad Request` - Malformed ID
* `404 Not Found` - Missing resource

#### `DELETE /api/v1/viewings/:id`
**Purpose:** Delete a viewing request.
**Path Parameters:**
* `id` (UUID, required)

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/v1/viewings/c3d4...
```
**Example Success (200 OK):**
```json
{
  "data": {
    "id": "c3d4...",
    "deleted": true
  }
}
```
**Important Expected Errors:**
* `400 Bad Request` - Malformed UUID
* `404 Not Found` - Valid missing UUID

## HTTP Status Codes
| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 200    | successful GET/PATCH/DELETE              |
| 201    | resource created                         |
| 400    | malformed route/query/JSON               |
| 404    | valid requested resource does not exist  |
| 422    | request body/business validation failure |
| 429    | rate limit exceeded                      |
| 500    | unexpected internal server error         |

## Rate Limiting
* **Keyed by:** IP
* **Limit:** 100 requests per 60 seconds
* **Values location:** `src/config/api.ts`
* **Exceeded:** Returns HTTP `429 Too Many Requests`
* **Headers:** `Retry-After` header is returned along with standard `RateLimit` header on blocked requests.
* **Architecture:** The current in-memory limiter is suitable for the current single-instance scope. A horizontally scaled production API should use a shared rate-limit store such as Redis.

## Seed Data
* Generated using `@faker-js/faker` with a fixed Faker seed for reproducibility.
* **Volume:** 300 Agents, 900 Properties, 1500 Viewings.
* Relationships remain valid across the dataset.
* The seed script clears dependent tables in order (Viewings, Properties, Agents) and recreates them, so repeated runs produce the same counts.
* **Command:** `npm run db:seed`
* *Note: This is development/demo data ONLY.*

## Design Decisions
1. **Domain:** A property marketplace was chosen to satisfy the requirements for three related resources.
2. **Identifiers:** UUIDs are used instead of sequential integers to prevent easy enumeration of resources and guessing of IDs.
3. **Versioning:** `/api/v1` exists from day one to ensure smooth future versioning without breaking existing clients.
4. **Pagination:** Offset pagination was selected because of its simplicity and ease of implementation for the bootcamp dataset.
5. **Cursor Pagination:** Cursor pagination would be preferable for very large or rapidly changing datasets in the future.
6. **Pricing Design:** Exact decimal storage (`Decimal`) is used for prices to strictly avoid floating-point arithmetic precision problems when dealing with monetary values.
7. **Response Envelopes:** Envelopes are consistent to provide a predictable structure for data, metadata, and errors across all endpoints.
8. **Configuration:** Pagination and rate-limit policies live in configuration (`src/config/api.ts`) rather than hardcoded in handlers to allow easy environment-based adjustment.
9. **Write Operations:** Agents and Properties act as the public marketplace catalog (read-only). Viewings are the transactional resource clients need to create and manage. This deliberately avoids building an admin/authentication system outside the assignment scope.
10. **Deletion semantics:** Cascading deletion was intentionally avoided (using `Restrict`) to prevent accidental mass deletion of records; dependent records must be explicitly handled.

## Scope
The API is the product. This project intentionally does **not** include:
* Authentication / login / signup
* Admin dashboard
* Payments
* Property administration UI
* Marketing website
* Complex consumer

A minimal consumer will be built separately only to prove external consumption.

## Tests and Verification
The repository includes verification scripts:
* `npm run test:api`: Verifies read operations, writes, validation, and explicitly tests bad inputs to ensure no HTTP 500 errors occur.
* `npm run test:rate-limit`: Verifies rate limiting behavior.

A clean fresh-server limiter test confirmed:
* First 100 API requests accepted
* Request 101 blocked
* HTTP 429 and `Retry-After` returned

## Assessment Evidence
### Live API
`Pending deployment`
### GitHub repository
https://github.com/bukolaodeleye/propnest-api
### Live curl screenshot
`Pending deployment`
### 429 screenshot
`Pending deployment`
### Consumer screenshot
`Pending consumer application`
### Seed script
[prisma/seed.ts](./prisma/seed.ts)
