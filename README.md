# PropNest API

PropNest is a public REST API for browsing property listings, property agents, and property viewing requests.

## Resource Design

### Agent

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Unique identifier for the agent |
| name | string | Yes | Full name of the agent |
| email | string | Yes | Unique email address |
| phone | string | Yes | Phone number |
| agencyName | string | Yes | Name of the agency the agent represents |
| city | string | Yes | City where the agent operates |
| createdAt | datetime | No | Timestamp of creation |
| updatedAt | datetime | No | Timestamp of last update |

### Property

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Unique identifier for the property |
| title | string | Yes | Title of the property listing |
| description | string | Yes | Detailed description of the property |
| price | decimal/integer | Yes | Currency amount representing the price |
| city | string | Yes | City where the property is located |
| state | string | Yes | State where the property is located |
| address | string | Yes | Full physical address |
| bedrooms | integer | Yes | Number of bedrooms |
| bathrooms | integer | Yes | Number of bathrooms |
| propertyType | enum/string | Yes | Type of property (e.g., apartment, house, duplex, land, commercial) |
| listingType | enum/string | Yes | Type of listing (e.g., rent, sale) |
| status | enum/string | Yes | Availability status (e.g., available, unavailable) |
| agentId | UUID | Yes | Foreign key to the Agent who owns the listing |
| createdAt | datetime | No | Timestamp of creation |
| updatedAt | datetime | No | Timestamp of last update |

### Viewing

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Unique identifier for the viewing |
| propertyId | UUID | Yes | Foreign key to the Property |
| customerName | string | Yes | Name of the customer requesting the viewing |
| customerEmail | string | Yes | Email of the customer |
| customerPhone | string | Yes | Phone number of the customer |
| scheduledAt | datetime | Yes | Scheduled date and time for the viewing |
| status | enum/string | Yes | Status of the request (e.g., pending, confirmed, completed, cancelled) |
| createdAt | datetime | No | Timestamp of creation |
| updatedAt | datetime | No | Timestamp of last update |

## Resource Relationships

* **Agent 1 → many Properties**: One Agent can have many Properties. Each Property belongs to exactly one Agent.
* **Property 1 → many Viewings**: One Property can have many Viewings. Each Viewing belongs to exactly one Property.

```text
[ Agent ] 1 ------ * [ Property ] 1 ------ * [ Viewing ]
```

## Initial API Design

**Base Path:** `/api/v1`

### Agents
* `GET /api/v1/agents`
* `GET /api/v1/agents/:id`
* `GET /api/v1/agents/:id/properties`

### Properties
* `GET /api/v1/properties`
* `GET /api/v1/properties/:id`

### Viewings
* `GET /api/v1/viewings`
* `GET /api/v1/viewings/:id`
* `POST /api/v1/viewings`
* `PATCH /api/v1/viewings/:id`
* `DELETE /api/v1/viewings/:id`

## Pagination Strategy

* **Strategy:** Offset pagination
* **Default Limit:** 20
* **Maximum Limit:** 100
* **Behavior:** Negative offsets will eventually be rejected. Requests above the maximum limit will eventually be clamped to 100.

**Reasoning:**
Offset pagination is being chosen initially because it is simple for API consumers to use and understand, and appropriate for the expected bootcamp dataset size. Cursor pagination may be preferable for very large or rapidly changing datasets in the future.

## Response Envelope

### Successful Collection Response
```json
{
  "data": [],
  "meta": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Successful Single-Resource Response
```json
{
  "data": {}
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable explanation"
  }
}
```

## Design Decisions

* **Database & ORM:** PostgreSQL is the intended database, and Prisma ORM is being used to define the schema and interact with the data.
* **Identifiers:** UUIDs are implemented as the primary identifiers for all resources to prevent easy enumeration of resources and guessing of IDs.
* **Domain:** PropNest was selected as the domain for a property marketplace.
* **Relationships:** The `Agent → Property` and `Property → Viewing` relationships are explicitly represented in the Prisma schema with 1-to-many configurations.
* **Pricing Design:** Property prices use exact decimal storage (`Decimal`) to strictly avoid floating-point arithmetic precision problems when dealing with monetary values.
* **Versioning:** The API will use `/api/v1` from the beginning to ensure smooth future versioning without breaking existing clients.
* **Consistent Envelopes:** Responses use consistent envelopes to provide a predictable structure for data, metadata, and errors across all endpoints.
* **Pagination:** Offset pagination is the initial strategy because of its simplicity and ease of implementation for the bootcamp dataset.
* **Write Operations:** Agents and Properties act as the public marketplace catalog for this assignment. Viewing is the transactional resource clients need to create and manage. Therefore, the current public API exposes read operations for Agents/Properties, and read + create/update/delete for Viewings. This deliberately avoids building an admin/authentication system outside the assignment scope. This does not imply that a real production marketplace should allow unrestricted public administrative writes.

## Scope

This project will **not** initially include:
* Authentication
* Login/signup
* Payments
* Admin dashboard
* Marketing landing page
* Complex frontend application

The REST API is the primary product for this stage.

## Running Locally

To run the development server locally, install dependencies and start the dev script:

```bash
npm install
npm run dev
```

You can verify the server is running by hitting the health check endpoint:

```text
GET /api/v1/health
```

## Local Database Development

* Prisma ORM 7 is used as the database ORM.
* Local development uses Prisma Postgres via the `prisma dev` command.
* Migrations are tracked in the `prisma/migrations` directory. The initial migration creates the Agent, Property, and Viewing tables.
* The `.env` file contains the local connection information and is deliberately never committed.

**Check Migration Status:**
```bash
npx prisma migrate status
```

**Run Database Smoke Test:**
```bash
npm run db:smoke
```

## Development Seed Data

Faker is used for generating realistic development records.
The seed uses a fixed faker seed value for reproducibility and clears existing records in dependency order before inserting new data.
The seed script is committed at `prisma/seed.ts`.

> **Note**: This creates development/demo data ONLY, not production data!

**Seed Data Volume:**
* 300 Agents
* 900 Properties
* 1,500 Viewings

**Run the Seed Script:**
```bash
npm run db:seed
```

## API Endpoints (Read-Only)

All resource endpoints are versioned under `/api/v1`. The collection endpoints support **offset pagination**, **filtering**, and **sorting**.

### Agents
* `GET /api/v1/agents`
  * Filters: `city` (case-insensitive), `agencyName` (partial match)
  * Sort: `name`, `agencyName`, `city`, `createdAt` (default)
* `GET /api/v1/agents/:id`
* `GET /api/v1/agents/:id/properties`
  * Filters: `city`, `state`, `propertyType`, `listingType`, `status`, `bedrooms`, `minPrice`, `maxPrice`
  * Sort: `price`, `createdAt` (default), `bedrooms`, `bathrooms`, `city`

### Properties
* `GET /api/v1/properties`
  * Filters: `city` (case-insensitive), `state` (case-insensitive), `propertyType` (enum), `listingType` (enum), `status` (enum), `bedrooms` (integer), `minPrice`, `maxPrice`
  * Sort: `price`, `createdAt` (default), `bedrooms`, `bathrooms`, `city`
* `GET /api/v1/properties/:id`

### Viewings
* `GET /api/v1/viewings`
  * Filters: `status` (enum), `propertyId` (UUID), `from` (date/datetime), `to` (date/datetime)
  * Sort: `scheduledAt` (default), `createdAt`, `status`
* `GET /api/v1/viewings/:id`
* `POST /api/v1/viewings`
  * **Description**: Create a new viewing request.
  * **Body**: `application/json`
  * **Fields**:
    * `propertyId` (UUID, Required) - ID of the property to view
    * `customerName` (String, Required) - Full name of the customer
    * `customerEmail` (String, Required) - Valid email address
    * `customerPhone` (String, Required) - Phone number
    * `scheduledAt` (Datetime, Required) - ISO 8601 date and time for the viewing
    * `status` (Enum, Optional) - One of `pending`, `confirmed`, `completed`, `cancelled`. Defaults to `pending`.
  * **Example Request**:
    ```bash
    curl -X POST http://localhost:3000/api/v1/viewings \
      -H "Content-Type: application/json" \
      -d '{
        "propertyId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "customerName": "Ada Okafor",
        "customerEmail": "ada@example.com",
        "customerPhone": "+2348012345678",
        "scheduledAt": "2026-10-10T10:00:00.000Z"
      }'
    ```
  * **Example Success (201 Created)**:
    ```json
    {
      "data": {
        "id": "new-uuid",
        "propertyId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "customerName": "Ada Okafor",
        "customerEmail": "ada@example.com",
        "customerPhone": "+2348012345678",
        "scheduledAt": "2026-10-10T10:00:00.000Z",
        "status": "pending",
        "createdAt": "2026-09-22T10:00:00.000Z",
        "updatedAt": "2026-09-22T10:00:00.000Z"
      }
    }
    ```
  * **Example Error (422 Unprocessable Entity)**:
    ```json
    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "customerEmail Invalid email address"
      }
    }
    ```
* `PATCH /api/v1/viewings/:id`
  * **Description**: Partially update an existing viewing request.
  * **Body**: `application/json`
  * **Mutable Fields** (all optional, but at least one must be provided. Empty body is rejected):
    * `propertyId`
    * `customerName`
    * `customerEmail`
    * `customerPhone`
    * `scheduledAt`
    * `status`
  * **Example Request**:
    ```bash
    curl -X PATCH http://localhost:3000/api/v1/viewings/existing-uuid \
      -H "Content-Type: application/json" \
      -d '{
        "status": "confirmed"
      }'
    ```
  * **Example Success (200 OK)**: Returns the updated viewing in the `data` envelope.
* `DELETE /api/v1/viewings/:id`
  * **Description**: Delete a viewing request.
  * **Example Success (200 OK)**:
    ```json
    {
      "data": {
        "id": "deleted-uuid",
        "deleted": true
      }
    }
    ```
  * **Example Error (404 Not Found)**: Returns 404 if the viewing does not exist.

### HTTP Status Codes
* **200 OK**: Successful GET, successful PATCH, or successful DELETE confirmation.
* **201 Created**: Successful POST.
* **400 Bad Request**: Malformed route UUID, invalid query parameter, invalid sort field, or malformed JSON in request body.
* **404 Not Found**: The requested resource does not exist (e.g. valid UUID but no record).
* **422 Unprocessable Entity**: Body validation errors (missing required field, invalid email format, invalid status, empty PATCH) or valid UUID referencing a nonexistent foreign key.
* **500 Internal Server Error**: Unexpected server-side failure.

### Examples
```bash
curl "http://localhost:3000/api/v1/properties?city=Lagos&listingType=sale"
curl "http://localhost:3000/api/v1/properties?sort=price&order=desc&limit=10"
curl "http://localhost:3000/api/v1/viewings?status=pending"
```

### Pagination
Collection endpoints are paginated using `limit` and `offset` query parameters.
* **`limit`**: Defaults to 20. Maximum is 100. Values exceeding 100 are automatically clamped to 100. Invalid or negative values return HTTP 400.
* **`offset`**: Defaults to 0. Must be a non-negative integer. Negative values return HTTP 400.

### Envelopes & Serialization

**Collection Response:**
```json
{
  "data": [],
  "meta": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

**Single Resource Response:**
```json
{
  "data": { ... }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

*Note: The `price` of a Property is a precise monetary value and is serialized in JSON as a raw `string` (e.g., `"85000000"`) to avoid floating point precision loss. Currency formatting should be handled by the consumer.*

