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
