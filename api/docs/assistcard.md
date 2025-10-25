# Assistcard API Integration

**Project**: Travel Insurance Web Application
**API Provider**: Assistcard
**Version**: v1
**Last Updated**: 2025-01-16

---

## Overview

### Base URLs

| Environment | URL | Usage |
|-------------|-----|-------|
| **Sandbox** | `https://sandbox.assistcard.com` | Development & testing |
| **Production** | `https://api.assistcard.com` | Live transactions |

### API Credentials

Credentials are provided by Assistcard and stored as environment variables:

```env
# Assistcard API
ASSISTCARD_API_URL=https://sandbox.assistcard.com
ASSISTCARD_USERNAME=your_username
ASSISTCARD_PASSWORD=your_password

# Point Emisor (provided by Assistcard)
ASSISTCARD_COUNTRY_CODE=AR
ASSISTCARD_AGENCY_CODE=12345
ASSISTCARD_BRANCH_CODE=001
```

---

## Authentication

### Login

Authenticates and retrieves access token.

**Endpoint**: `POST /api/Authentication/login`

**Headers**:
```
Content-Type: application/json
Accept: text/plain
```

**Request Body**:
```json
{
  "userName": "your_username",
  "password": "your_password"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userName` | `string` | ✅ | Username provided by Assistcard |
| `password` | `string` | ✅ | Password provided by Assistcard |

---

**Response (Success)**:

**Status**: `200 OK`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiration": "2025-01-16T18:30:00Z"
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | `uuid` | Unique identifier for tracking this request |
| `isSuccess` | `boolean` | `true` if successful, `false` if error |
| `data.token` | `string` | Bearer token for API authentication |
| `data.expiration` | `datetime` | Token expiration (UTC) |

---

**Response (Error)**:

**Status**: `401 Unauthorized`

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "traceId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Error Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | RFC 7235 error type reference |
| `title` | `string` | Human-readable error title |
| `status` | `integer` | HTTP status code |
| `traceId` | `uuid` | Unique identifier for debugging |

---

**TypeScript Example**:

```typescript
// lib/assistcard/auth.ts

interface LoginResponse {
  traceId: string
  isSuccess: boolean
  data?: {
    token: string
    expiration: string
  }
  type?: string
  title?: string
  status?: number
}

export async function assistcardLogin(): Promise<{
  token: string
  expiresAt: Date
}> {
  const response = await fetch(
    `${process.env.ASSISTCARD_API_URL}/api/Authentication/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      },
      body: JSON.stringify({
        userName: process.env.ASSISTCARD_USERNAME,
        password: process.env.ASSISTCARD_PASSWORD,
      }),
    }
  )

  const data: LoginResponse = await response.json()

  if (!response.ok || !data.isSuccess) {
    throw new Error(
      `Assistcard login failed: ${data.title || 'Unknown error'} (traceId: ${data.traceId})`
    )
  }

  return {
    token: data.data!.token,
    expiresAt: new Date(data.data!.expiration),
  }
}
```

---

### Refresh Token

Refreshes an expired token without requiring username/password re-authentication.

**Security Strategy**: Assistcard recommends short-lived bearer tokens (e.g., a few minutes). When a token expires, the application can request a new token using the refresh endpoint instead of requiring the user to log in again.

**Endpoint**: `POST /api/Authentication/token/refresh`

**Headers**:
```
Accept: text/plain
Authorization: Bearer <current_token>
```

**Request Body**: None

**Cookie**: Uses HTTP cookie set during initial login (automatically sent by browser/HTTP client)

**Parameters**: None - authentication happens via cookie

---

**Response (Success)**:

**Status**: `200 OK`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiration": "2025-01-16T19:00:00Z"
  }
}
```

**Response Fields**: Same as Login endpoint

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | `uuid` | Unique identifier for tracking this request |
| `isSuccess` | `boolean` | `true` if successful, `false` if error |
| `data.token` | `string` | New bearer token for API authentication |
| `data.expiration` | `datetime` | New token expiration (UTC) |

---

**Response (Error)**:

**Status**: `401 Unauthorized` or `400 Bad Request`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": false,
  "errorCode": "TOKEN_EXPIRED",
  "errorMessage": "Refresh token has expired. Please log in again."
}
```

**Error Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | `uuid` | Unique identifier for debugging |
| `isSuccess` | `boolean` | Always `false` for errors |
| `errorCode` | `string` | Error code identifier |
| `errorMessage` | `string` | Human-readable error description |

---

**TypeScript Example**:

```typescript
// lib/assistcard/auth.ts

interface RefreshResponse {
  traceId: string
  isSuccess: boolean
  data?: {
    token: string
    expiration: string
  }
  errorCode?: string
  errorMessage?: string
}

export async function assistcardRefreshToken(
  currentToken: string
): Promise<{
  token: string
  expiresAt: Date
}> {
  const response = await fetch(
    `${process.env.ASSISTCARD_API_URL}/api/Authentication/token/refresh`,
    {
      method: 'POST',
      headers: {
        'Accept': 'text/plain',
        'Authorization': `Bearer ${currentToken}`,
      },
      credentials: 'include', // Important: send cookies
    }
  )

  const data: RefreshResponse = await response.json()

  if (!response.ok || !data.isSuccess) {
    throw new Error(
      `Token refresh failed: ${data.errorMessage || 'Unknown error'} (traceId: ${data.traceId})`
    )
  }

  return {
    token: data.data!.token,
    expiresAt: new Date(data.data!.expiration),
  }
}
```

---

**Token Management Strategy**:

```typescript
// lib/assistcard/token-manager.ts

interface TokenCache {
  token: string
  expiresAt: Date
}

let tokenCache: TokenCache | null = null

export async function getValidToken(): Promise<string> {
  const now = new Date()

  // Check if token exists and is still valid
  if (tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.token
  }

  // Token expired or doesn't exist
  if (tokenCache) {
    // Try to refresh
    try {
      const { token, expiresAt } = await assistcardRefreshToken(tokenCache.token)
      tokenCache = { token, expiresAt }
      return token
    } catch (error) {
      console.warn('Token refresh failed, logging in again:', error.message)
      // Fall through to login
    }
  }

  // No token or refresh failed - do full login
  const { token, expiresAt } = await assistcardLogin()
  tokenCache = { token, expiresAt }
  return token
}

export function clearTokenCache(): void {
  tokenCache = null
}
```

**Notes**:
- Cookie is automatically set by Assistcard during initial login
- When token expires, user cannot access protected resources (Quote, Issue endpoints)
- Refresh token extends session without re-entering credentials
- If refresh fails, fall back to full login

---

## Quote Products

Get available insurance products and pricing based on travel parameters.

**Purpose**: Retrieve all active product plans available at the issuing point (Point Emisor) based on coverage dates, passenger ages, and origin-destination. This endpoint should be called **before** issuing a policy.

**Workflow**: Quote → Select Product → Issue Policy

**Endpoint**: `POST /api/v1/Quote/product`

**Authentication**: Bearer token required

**Headers**:
```
Content-Type: application/json
Accept: text/plain
Authorization: Bearer <token>
```

---

### Request Parameters

#### Point Emisor (Fixed per integration)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `countryCode` | `string` | ✅ | ISO 3166-1 alpha-2 country code (e.g., "AR") |
| `agencyCode` | `string` | ✅ | Agency code (max 5 chars, provided by Assistcard) |
| `branchCode` | `integer` | ✅ | Branch code (0-999, provided by Assistcard) |

**Note**: These values are fixed for your integration and stored as environment variables.

---

#### Coverage Dates

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `beginDate` | `string` | ✅ | Coverage start date (inclusive) - Format: "YYYY/MM/DD" |
| `endDate` | `string` | ✅ | Coverage end date (inclusive) - Format: "YYYY/MM/DD" |

**Note**: Coverage duration is calculated inclusive (first day to last day).

---

#### Itinerary

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `itinerary.code` | `string` | ✅ | Data format type - Use `"AIRPORT"` for IATA codes |
| `itinerary.origin` | `string` | ✅ | Origin IATA code (e.g., "EZE" for Buenos Aires) |
| `itinerary.destination` | `string` | ✅ | Destination IATA code (e.g., "MIA" for Miami) |

---

#### Passengers

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `passengers` | `array` | ✅ | Array of passenger objects |
| `passengers[].countryCode` | `string` | ✅ | Passenger country code (ISO 3166-1 alpha-2) |
| `passengers[].birthDate` | `string` | ✅ | Birth date - Format: "YYYY/MM/DD" |

**Age-based Pricing**:
- **70+ years**: +50% surcharge
- **75+ years**: +100% surcharge

---

#### Optional Filters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `travelType` | `integer` | Optional | `1` = Daily, `2` = MultiTrip |
| `quoteAnnual` | `boolean` | Optional | `true` to include annual plans |
| `multiTripModalityFilter` | `array` | Optional | Filter MultiTrip modalities (e.g., `["M60D"]`) |
| `paymentMethod` | `string` | Optional | `"CreditCard"` or `"CheckingAccount"` (default) |
| `language` | `string` | Optional | `"es"`, `"pt"`, or `"en"` (default: country default) |

---

#### Price Modifiers (Optional)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `priceModifiers.promotionalCode` | `string` | Optional | Promotional code |
| `priceModifiers.markup` | `number` | Optional | Markup percentage/value (Brazil only) |
| `priceModifiers.comissionDiscount` | `number` | Optional | Commission discount (Brazil only) |

---

### Request Body Example

```json
{
  "countryCode": "AR",
  "agencyCode": "12345",
  "branchCode": 1,
  "beginDate": "2025/02/01",
  "endDate": "2025/02/15",
  "travelType": 1,
  "quoteAnnual": null,
  "multiTripModalityFilter": null,
  "itinerary": {
    "code": "AIRPORT",
    "origin": "EZE",
    "destination": "MIA"
  },
  "paymentMethod": "CreditCard",
  "passengers": [
    {
      "countryCode": "AR",
      "birthDate": "1990/05/15"
    }
  ],
  "priceModifiers": {
    "promotionalCode": "SUMMER2025"
  },
  "language": "es"
}
```

---

### Response (Success)

**Status**: `200 OK`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": true,
  "data": {
    "destinationArea": "USA",
    "exchangeRate": 1050.50,
    "processingFee": 2.50,
    "quotedProducts": [
      {
        "productCode": "AC",
        "rateCode": "150",
        "name": "AC 150",
        "description": "Cobertura estándar para viajes internacionales",
        "rateCaption": "Gastos médicos USD 150,000 | Equipaje USD 1,200",
        "passengersURL": "https://www.assistcard.com/ar/...",
        "currency": "USD",
        "modality": "Daily",
        "modalityCode": "D",
        "allowMarkup": false,
        "promotionalOffer": {
          "code": "SUMMER2025",
          "description": "Descuento de verano",
          "percentage": "15%"
        },
        "amount": {
          "totalOriginal": 450.00,
          "total": 382.50,
          "totalNoTaxesIncluded": 382.50,
          "subtotalAssistance": 300.00,
          "subtotalInsurance": 82.50
        }
      },
      {
        "productCode": "AC",
        "rateCode": "250",
        "name": "AC 250",
        "description": "Cobertura premium con mayor protección",
        "rateCaption": "Gastos médicos USD 250,000 | Equipaje USD 2,000",
        "passengersURL": "https://www.assistcard.com/ar/...",
        "currency": "USD",
        "modality": "Daily",
        "modalityCode": "D",
        "allowMarkup": false,
        "promotionalOffer": null,
        "amount": {
          "totalOriginal": 650.00,
          "total": 650.00,
          "totalNoTaxesIncluded": 650.00,
          "subtotalAssistance": 520.00,
          "subtotalInsurance": 130.00
        }
      }
    ]
  }
}
```

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | `uuid` | Request tracking ID |
| `isSuccess` | `boolean` | `true` if successful |
| `data.destinationArea` | `string` | Destination area code |
| `data.exchangeRate` | `number` | USD exchange rate to local currency |
| `data.processingFee` | `number` | Payment gateway fee (USD) |
| `data.quotedProducts` | `array` | Available products |

#### Product Object

| Field | Type | Description |
|-------|------|-------------|
| `productCode` | `string` | Product code (2 digits) |
| `rateCode` | `string` | Rate code (alphanumeric) |
| `name` | `string` | Product plan name |
| `description` | `string` | Product description |
| `rateCaption` | `string` | Coverage summary (display to user) |
| `passengersURL` | `string` | Assistcard website URL with pre-filled data |
| `currency` | `string` | Currency code (ISO 4217, e.g., "USD") |
| `modality` | `string` | Plan type (e.g., "Daily", "MultiTrip") |
| `modalityCode` | `string` | Modality code |
| `allowMarkup` | `boolean` | Whether markup can be applied |
| `promotionalOffer` | `object\|null` | Applied promotion (if any) |
| `amount` | `object` | Pricing breakdown |

#### Amount Object

| Field | Type | Description |
|-------|------|-------------|
| `totalOriginal` | `number` | Price before promotions |
| `total` | `number` | Final price (excludes financial taxes) |
| `totalNoTaxesIncluded` | `number` | Price without taxes or financial interest |
| `subtotalAssistance` | `number` | Assistance services subtotal |
| `subtotalInsurance` | `number` | Insurance coverage subtotal |

**Important**:
- **Gross Rate** (comisionable): `total` is the final customer price
- **Net Rate** (no comisionable): Apply markup to `total` to get final customer price

---

### Response (Error)

**Status**: `400 Bad Request` or `500 Internal Server Error`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": false,
  "errorCode": "INVALID_DATES",
  "errorMessage": "End date must be after begin date"
}
```

---

### Travel Type Cases

Configure `travelType`, `quoteAnnual`, and `multiTripModalityFilter` based on your needs:

#### Case 1: Daily Plans (Default)
```json
{
  "travelType": 1,
  "quoteAnnual": null,
  "multiTripModalityFilter": null
}
```

#### Case 2: Daily Plans Only
```json
{
  "travelType": 1,
  "quoteAnnual": null,
  "multiTripModalityFilter": null
}
```

#### Case 3: MultiTrip Plans
```json
{
  "travelType": 2,
  "quoteAnnual": null,
  "multiTripModalityFilter": ["M60D"]  // Optional filter
}
```

#### Case 4: MultiTrip + Annual Plans
```json
{
  "travelType": 2,
  "quoteAnnual": true,
  "multiTripModalityFilter": ["M60D"]  // Optional filter
}
```

---

### TypeScript Example

```typescript
// lib/assistcard/quote.ts

interface QuoteProductRequest {
  countryCode: string
  agencyCode: string
  branchCode: number
  beginDate: string // "YYYY/MM/DD"
  endDate: string
  travelType?: number
  quoteAnnual?: boolean | null
  multiTripModalityFilter?: string[] | null
  itinerary: {
    code: 'AIRPORT'
    origin: string
    destination: string
  }
  paymentMethod?: 'CreditCard' | 'CheckingAccount'
  passengers: Array<{
    countryCode: string
    birthDate: string // "YYYY/MM/DD"
  }>
  priceModifiers?: {
    promotionalCode?: string
    markup?: number
    comissionDiscount?: number
  }
  language?: 'es' | 'pt' | 'en'
}

interface QuoteProductResponse {
  traceId: string
  isSuccess: boolean
  data?: {
    destinationArea: string
    exchangeRate: number
    processingFee: number
    quotedProducts: Array<{
      productCode: string
      rateCode: string
      name: string
      description: string
      rateCaption: string
      passengersURL: string
      currency: string
      modality: string
      modalityCode: string
      allowMarkup: boolean
      promotionalOffer: {
        code: string
        description: string
        percentage: string
      } | null
      amount: {
        totalOriginal: number
        total: number
        totalNoTaxesIncluded: number
        subtotalAssistance: number
        subtotalInsurance: number
      }
    }>
  }
  errorCode?: string
  errorMessage?: string
}

export async function quoteProducts(
  params: Omit<QuoteProductRequest, 'countryCode' | 'agencyCode' | 'branchCode'>,
  token: string
): Promise<QuoteProductResponse['data']> {
  const response = await fetch(
    `${process.env.ASSISTCARD_API_URL}/api/v1/Quote/product`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        countryCode: process.env.ASSISTCARD_COUNTRY_CODE,
        agencyCode: process.env.ASSISTCARD_AGENCY_CODE,
        branchCode: parseInt(process.env.ASSISTCARD_BRANCH_CODE!),
        ...params,
      }),
    }
  )

  const data: QuoteProductResponse = await response.json()

  if (!response.ok || !data.isSuccess) {
    throw new Error(
      `Quote failed: ${data.errorMessage || 'Unknown error'} (traceId: ${data.traceId})`
    )
  }

  return data.data!
}
```

**Usage**:
```typescript
const token = await getValidToken()

const products = await quoteProducts(
  {
    beginDate: '2025/02/01',
    endDate: '2025/02/15',
    itinerary: {
      code: 'AIRPORT',
      origin: 'EZE',
      destination: 'MIA',
    },
    passengers: [
      {
        countryCode: 'AR',
        birthDate: '1990/05/15',
      },
    ],
    travelType: 1,
    paymentMethod: 'CreditCard',
    language: 'es',
  },
  token
)

// Display products to user
products.quotedProducts.forEach((product) => {
  console.log(`${product.name}: $${product.amount.total} ${product.currency}`)
})
```

---

### Important Notes

**Point Emisor Configuration**:
- Different Point Emisor codes may be needed for different business verticals
- Example configurations:
  - **Point Emisor A** (Flight/Package cross-sell): Uses exact age, few rates for fast checkout
  - **Point Emisor B** (Hotel cross-sell): Generic/no age, flat rates
  - **Point Emisor C** (Standalone insurance): Uses exact age, many rates for flexibility

**Gross vs Net Rates**:
- **Gross Rate** (Tarifa Bruta): Response price is final customer price (includes commission)
- **Net Rate** (Tarifa Neta): Add markup in your system to get final customer price

**Age-Based Pricing**:
- Passengers 70+: +50% surcharge
- Passengers 75+: +100% surcharge
- Used when Point Emisor is configured for exact age pricing

**Workflow**:
1. Call Quote/product to get available plans
2. Display products to user
3. User selects product + addons (optional)
4. Call Issue/policy to create the voucher

---

## Quote Addons

Get available optional addons (upgrades) for a selected product.

**Purpose**: Retrieve optional coverage enhancements/upgrades that can be added to a base insurance product. Called **after** the user selects a product from Quote Products.

**Workflow**: Quote Products → User Selects Product → Quote Addons → User Selects Addons (Optional) → Issue Policy

**Endpoint**: `POST /api/v1/Quote/addons`

**Authentication**: Bearer token required

**Headers**:
```
Content-Type: application/json
Accept: text/plain
Authorization: Bearer <token>
```

---

### Request Parameters

#### Point Emisor (Fixed per integration)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `countryCode` | `string` | ✅ | ISO 3166-1 alpha-2 country code |
| `agencyCode` | `string` | ✅ | Agency code (max 5 chars) |
| `branchCode` | `integer` | ✅ | Branch code (0-999) |

#### Coverage & Product

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `beginDate` | `string` | ✅ | Coverage start date - Format: "YYYY/MM/DD" |
| `endDate` | `string` | ✅ | Coverage end date - Format: "YYYY/MM/DD" |
| `productCode` | `string` | ✅ | Selected product code (from Quote Products response) |
| `rateCode` | `string` | ✅ | Selected rate code (from Quote Products response) |

#### Passengers

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `passengers` | `array` | ✅ | Array of passenger objects |
| `passengers[].countryCode` | `string` | ✅ | Passenger country code (ISO 3166-1 alpha-2) |
| `passengers[].birthDate` | `string` | ✅ | Birth date - Format: "YYYY/MM/DD" |

#### Optional

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `language` | `string` | Optional | `"es"`, `"pt"`, or `"en"` |

---

### Request Body Example

```json
{
  "countryCode": "AR",
  "agencyCode": "12345",
  "branchCode": 1,
  "beginDate": "2025/02/01",
  "endDate": "2025/02/15",
  "productCode": "AC",
  "rateCode": "150",
  "passengers": [
    {
      "countryCode": "AR",
      "birthDate": "1990/05/15"
    }
  ],
  "language": "es"
}
```

---

### Response (Success)

**Status**: `200 OK`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": true,
  "data": {
    "quotedAddons": [
      {
        "productCode": "COVID",
        "name": "Cobertura COVID-19",
        "description": "Cobertura adicional para gastos médicos relacionados con COVID-19",
        "categories": [
          {
            "rateCode": "COVID_BASIC",
            "rateCategory": 50000,
            "currency": "USD",
            "allowedPassengers": [
              {
                "birthDate": "1990/05/15"
              }
            ],
            "amount": {
              "totalOriginal": 75.00,
              "total": 75.00,
              "subtotalAssistance": 60.00,
              "subtotalInsurance": 15.00
            }
          },
          {
            "rateCode": "COVID_PREMIUM",
            "rateCategory": 100000,
            "currency": "USD",
            "allowedPassengers": [
              {
                "birthDate": "1990/05/15"
              }
            ],
            "amount": {
              "totalOriginal": 125.00,
              "total": 125.00,
              "subtotalAssistance": 100.00,
              "subtotalInsurance": 25.00
            }
          }
        ]
      },
      {
        "productCode": "SPORTS",
        "name": "Cobertura Deportes Extremos",
        "description": "Protección para actividades deportivas de alto riesgo",
        "categories": [
          {
            "rateCode": "SPORTS_STANDARD",
            "rateCategory": 25000,
            "currency": "USD",
            "allowedPassengers": [
              {
                "birthDate": "1990/05/15"
              }
            ],
            "amount": {
              "totalOriginal": 50.00,
              "total": 50.00,
              "subtotalAssistance": 40.00,
              "subtotalInsurance": 10.00
            }
          }
        ]
      }
    ]
  }
}
```

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | `uuid` | Request tracking ID |
| `isSuccess` | `boolean` | `true` if successful |
| `data.quotedAddons` | `array` | Available addons |

#### Addon Object

| Field | Type | Description |
|-------|------|-------------|
| `productCode` | `string` | Addon product code |
| `name` | `string` | Addon name |
| `description` | `string` | Addon description |
| `categories` | `array` | Available coverage tiers for this addon |

#### Category Object

| Field | Type | Description |
|-------|------|-------------|
| `rateCode` | `string` | Rate code for this category |
| `rateCategory` | `number` | Coverage amount (e.g., 50000 = USD 50,000) |
| `currency` | `string` | Currency code (ISO 4217) |
| `allowedPassengers` | `array` | List of passengers eligible for this addon |
| `allowedPassengers[].birthDate` | `string` | Passenger birth date |
| `amount` | `object` | Pricing breakdown |

#### Amount Object

| Field | Type | Description |
|-------|------|-------------|
| `totalOriginal` | `number` | Price before promotions |
| `total` | `number` | Final price (excludes financial taxes) |
| `subtotalAssistance` | `number` | Assistance services subtotal |
| `subtotalInsurance` | `number` | Insurance coverage subtotal |

---

### Response (Error)

**Status**: `400 Bad Request` or `500 Internal Server Error`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": false,
  "errorCode": "INVALID_PRODUCT",
  "errorMessage": "Product code does not exist"
}
```

---

### TypeScript Example

```typescript
// lib/assistcard/quote.ts

interface QuoteAddonsRequest {
  countryCode: string
  agencyCode: string
  branchCode: number
  beginDate: string // "YYYY/MM/DD"
  endDate: string
  productCode: string
  rateCode: string
  passengers: Array<{
    countryCode: string
    birthDate: string // "YYYY/MM/DD"
  }>
  language?: 'es' | 'pt' | 'en'
}

interface QuoteAddonsResponse {
  traceId: string
  isSuccess: boolean
  data?: {
    quotedAddons: Array<{
      productCode: string
      name: string
      description: string
      categories: Array<{
        rateCode: string
        rateCategory: number
        currency: string
        allowedPassengers: Array<{
          birthDate: string
        }>
        amount: {
          totalOriginal: number
          total: number
          subtotalAssistance: number
          subtotalInsurance: number
        }
      }>
    }>
  }
  errorCode?: string
  errorMessage?: string
}

export async function quoteAddons(
  params: Omit<QuoteAddonsRequest, 'countryCode' | 'agencyCode' | 'branchCode'>,
  token: string
): Promise<QuoteAddonsResponse['data']> {
  const response = await fetch(
    `${process.env.ASSISTCARD_API_URL}/api/v1/Quote/addons`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        countryCode: process.env.ASSISTCARD_COUNTRY_CODE,
        agencyCode: process.env.ASSISTCARD_AGENCY_CODE,
        branchCode: parseInt(process.env.ASSISTCARD_BRANCH_CODE!),
        ...params,
      }),
    }
  )

  const data: QuoteAddonsResponse = await response.json()

  if (!response.ok || !data.isSuccess) {
    throw new Error(
      `Quote addons failed: ${data.errorMessage || 'Unknown error'} (traceId: ${data.traceId})`
    )
  }

  return data.data!
}
```

**Usage Example**:
```typescript
const token = await getValidToken()

// Step 1: Quote products
const products = await quoteProducts({ /* ... */ }, token)

// Step 2: User selects a product
const selectedProduct = products.quotedProducts[0]

// Step 3: Quote addons for selected product
const addons = await quoteAddons(
  {
    beginDate: '2025/02/01',
    endDate: '2025/02/15',
    productCode: selectedProduct.productCode,
    rateCode: selectedProduct.rateCode,
    passengers: [
      {
        countryCode: 'AR',
        birthDate: '1990/05/15',
      },
    ],
    language: 'es',
  },
  token
)

// Step 4: Display addons to user
addons.quotedAddons.forEach((addon) => {
  console.log(`${addon.name}:`)
  addon.categories.forEach((category) => {
    console.log(`  - Coverage: $${category.rateCategory}`)
    console.log(`  - Price: $${category.amount.total} ${category.currency}`)
  })
})
```

---

### Important Notes

**When to Call**:
- Call this endpoint **after** the user selects a product from Quote Products
- Addons are **optional** - user can proceed to issue policy without selecting any

**Multiple Categories**:
- Some addons have multiple coverage tiers (categories)
- Each category has different coverage amounts and prices
- Display all categories to let user choose their preferred level

**Allowed Passengers**:
- Some addons may not be available for all passengers (e.g., age restrictions)
- Check `allowedPassengers` array to determine eligibility
- Only show addon to passengers included in `allowedPassengers` list

**Pricing**:
- Addon prices are **per passenger**
- Total addon cost = addon price × number of passengers selecting it

**Workflow**:
1. User selects base product from Quote Products
2. Call Quote Addons with selected product's `productCode` and `rateCode`
3. Display available addons with categories
4. User selects desired addons (optional)
5. Proceed to Issue Policy with base product + selected addons

---

## Issue Policy

Issues insurance vouchers with credit card payment.

**Purpose**: Create insurance vouchers for passengers after collecting full details and payment information. This endpoint charges the customer's credit card and registers the policy in Assistcard's system.

**Workflow**: Quote Products → Select Product → Quote Addons (optional) → Collect Passenger Details → **Tokenize Card → Issue Policy**

**Endpoint**: `POST /api/v1/Issuance/credit-card/vouchers`

**Authentication**: Bearer token required

**PCI Compliance Required**: You must be PCI DSS certified to handle tokenized credit card data. Assistcard requires AOC (Attestation of Compliance) or SAQ-D documentation.

**Max Passengers**: 16 passengers per request

---

### Step 1: Card Tokenization (Client-Side)

**Important**: Card tokenization **must** be done **client-side** (browser/mobile app) to maintain PCI compliance. Never send raw card numbers to your server.

**TokenEx Service**:

| Environment | URL | Header Value |
|-------------|-----|--------------|
| **Sandbox** | `https://test-tgapi.tokenex.com/Tokenize/Proxy/5908704472867899` | `TX-Proxy-Key: eg6OFE5KPv5OLw19y9LJYrbdrSn4ehZMDsbnOGer` |
| **Production** | Provided by Assistcard | Provided by Assistcard |

**Request**:

```typescript
// Client-side code (React component)
const tokenizeCard = async (cardNumber: string, cvv: string) => {
  const response = await fetch(
    'https://test-tgapi.tokenex.com/Tokenize/Proxy/5908704472867899',
    {
      method: 'POST',
      headers: {
        'TX-Proxy-Key': 'eg6OFE5KPv5OLw19y9LJYrbdrSn4ehZMDsbnOGer',
      },
      body: JSON.stringify({
        cardNumber: cardNumber,
        securityCode: cvv,
      }),
    }
  )

  const data = await response.json()

  return {
    cardNumberToken: data.json.cardNumber, // Tokenized card number
    cvvToken: data.json.securityCode, // Tokenized CVV
  }
}
```

**Response**:
```json
{
  "json": {
    "cardNumber": "400000Cpcp3Q1091",
    "securityCode": "tokenized_cvv_here"
  }
}
```

**Important**: The tokens must be wrapped in **triple braces** when sent to Issue endpoint:
- `{{{400000Cpcp3Q1091}}}` for card number
- `{{{tokenized_cvv}}}` for CVV

---

### Step 2: Issue Policy (Server-Side)

**Endpoint**: `POST /api/v1/Issuance/credit-card/vouchers`

**Headers**:
```
Content-Type: application/json
Accept: text/plain
Authorization: Bearer <token>
```

---

### Request Parameters

#### Point Emisor & Product

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `countryCode` | `string` | ✅ | ISO 3166-1 alpha-2 country code |
| `agencyCode` | `string` | ✅ | Agency code (max 5 chars) |
| `branchCode` | `integer` | ✅ | Branch code (0-999) |
| `counterCode` | `string` | ✅ | Agent/seller ID (for sales tracking) |
| `productCode` | `string` | ✅ | Product code (from quote) |
| `rateCode` | `string` | ✅ | Rate code (from quote) |
| `beginDate` | `string` | ✅ | Coverage start - Format: "YYYY/MM/DD" |
| `endDate` | `string` | ✅ | Coverage end - Format: "YYYY/MM/DD" |

#### Itinerary

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `itinerary.code` | `string` | ✅ | `"AIRPORT"` for IATA codes |
| `itinerary.origin` | `string` | ✅ | Origin IATA code |
| `itinerary.destination` | `string` | ✅ | Destination IATA code |

---

#### Passengers (Array - max 16)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `passengers[].countryCode` | `string` | ✅ | Passenger country code |
| `passengers[].documentType` | `integer` | ✅ | Document type (1 = Passport for non-Brazil/Spain) |
| `passengers[].documentNumber` | `string` | ✅ | ID document number |
| `passengers[].birthDate` | `string` | ✅ | Birth date - Format: "YYYY/MM/DD" |
| `passengers[].lastname` | `string` | ✅ | Last name(s) |
| `passengers[].name` | `string` | ✅ | First name(s) |
| `passengers[].email` | `string` | ✅ | Email (receives voucher) |
| `passengers[].phone` | `string` | ✅ | Phone: `{countryCode} {areaCode} {number}` |
| `passengers[].preferredSurname` | `string` | Optional | Social last name (Brazil only) |
| `passengers[].preferredName` | `string` | Optional | Social first name (Brazil only) |
| `passengers[].bookingCode` | `string` | Optional | Your internal reference code |

**Address Data** (nested in each passenger):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `addressData.countryCode` | `string` | ✅ | Residence country (ISO 3166-1 alpha-2) |
| `addressData.streetName` | `string` | ✅ | Street name |
| `addressData.streetNumber` | `string` | ✅ | Street number |
| `addressData.complements` | `string` | Optional | Apartment, floor, etc. |
| `addressData.postalCode` | `string` | ✅ | Postal code |
| `addressData.city` | `string` | ✅ | City |
| `addressData.state` | `string` | ✅ | State/province |

**Addons** (optional, nested in each passenger):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `addons[].code` | `string` | ✅ | Addon code (from Quote Addons) |
| `addons[].rateCode` | `string` | ✅ | Addon rate code |
| `addons[].category` | `number` | ✅ | Coverage amount (e.g., 50000) |

---

#### Payment Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `paymentDetails.currency` | `string` | Optional | Payment currency (ISO 4217, defaults to local) |
| `paymentDetails.amount` | `number` | ✅ | Total amount (must match quoted price) |
| `paymentDetails.installments` | `integer` | Optional | Number of installments (default: 1) |
| `paymentDetails.cardNumber` | `string` | ✅ | **Tokenized** card wrapped in `{{{token}}}` |
| `paymentDetails.cardHolder` | `string` | ✅ | Cardholder name (as shown on card) |
| `paymentDetails.expirationDate` | `string` | ✅ | Expiration - Format: "MM/YY" |
| `paymentDetails.cvv` | `string` | ✅ | **Tokenized** CVV wrapped in `{{{token}}}` |
| `paymentDetails.documentNumber` | `string` | ✅ | Cardholder ID number |
| `paymentDetails.brand` | `string` | ✅ | Card brand code (see brand codes) |
| `paymentDetails.email` | `string` | ✅ | Cardholder email |
| `paymentDetails.phone` | `string` | Optional | Cardholder phone |

#### Price Modifiers (Optional)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `priceModifiers.promotionalCode` | `string` | Optional | Promotional code |
| `priceModifiers.markup` | `number` | Optional | Markup (Brazil only) |
| `priceModifiers.comissionDiscount` | `number` | Optional | Commission discount (Brazil only) |

---

### Request Body Example

```json
{
  "countryCode": "AR",
  "agencyCode": "12345",
  "branchCode": 1,
  "counterCode": "AGENT_001",
  "productCode": "AC",
  "rateCode": "150",
  "beginDate": "2025/02/01",
  "endDate": "2025/02/15",
  "itinerary": {
    "code": "AIRPORT",
    "origin": "EZE",
    "destination": "MIA"
  },
  "passengers": [
    {
      "countryCode": "AR",
      "documentType": 1,
      "documentNumber": "12345678",
      "birthDate": "1990/05/15",
      "lastname": "García",
      "name": "Juan",
      "email": "juan.garcia@example.com",
      "phone": "54 11 22223333",
      "bookingCode": "BK123456",
      "addressData": {
        "countryCode": "AR",
        "streetName": "Av. Corrientes",
        "streetNumber": "1234",
        "complements": "Piso 5 Depto A",
        "postalCode": "C1043",
        "city": "Buenos Aires",
        "state": "Buenos Aires"
      },
      "addons": [
        {
          "code": "COVID",
          "rateCode": "COVID_BASIC",
          "category": 50000
        }
      ]
    }
  ],
  "priceModifiers": {
    "promotionalCode": "SUMMER2025"
  },
  "paymentDetails": {
    "currency": "ARS",
    "amount": 450.00,
    "installments": 1,
    "cardNumber": "{{{400000Cpcp3Q1091}}}",
    "cardHolder": "Juan Garcia",
    "expirationDate": "12/27",
    "cvv": "{{{tokenized_cvv}}}",
    "documentNumber": "12345678",
    "brand": "VISA",
    "email": "juan.garcia@example.com",
    "phone": "54 11 22223333"
  }
}
```

---

### Response (Success)

**Status**: `200 OK`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": true,
  "data": {
    "countryIdentifier": 54,
    "voucherGroup": 987654321,
    "issuanceDate": "2025/01/16",
    "exchangeRate": 1050.50,
    "vouchers": [
      {
        "code": 123456789,
        "policyCode": null,
        "bookingCode": "BK123456",
        "documentNumber": "12345678",
        "lastName": "García",
        "name": "Juan",
        "ekitURL": "https://documents.assistcard.com/voucher/123456789",
        "policyURL": null,
        "productCode": "AC",
        "productName": "AC 150",
        "effectiveDateStart": "2025/02/01",
        "effectiveDateEnd": "2025/02/15",
        "amountRate": {
          "totalOriginal": 450.00,
          "total": 382.50,
          "subtotalAssistance": 300.00,
          "subtotalInsurance": 82.50,
          "financialTaxes": 0.00,
          "promotionalCode": "SUMMER2025",
          "addons": [
            {
              "code": "COVID",
              "rateCode": "COVID_BASIC",
              "category": 50000,
              "totalOriginal": 75.00,
              "total": 75.00,
              "subtotalAssistance": 60.00,
              "subtotalInsurance": 15.00,
              "financialTaxes": 0.00,
              "promotionalCode": null
            }
          ]
        }
      }
    ],
    "paymentDetails": {
      "method": "CreditCard",
      "brand": "VISA",
      "installments": 1,
      "referenceNumber": "TXN_987654321",
      "currency": "ARS",
      "totalPaid": 401812.50,
      "amountRate": {
        "totalOriginal": 450.00,
        "total": 382.50,
        "processingFee": 2.50,
        "financialTaxes": 0.00,
        "financialInterest": 0.00,
        "taxesIncluded": 382.50,
        "noTaxesIncluded": 382.50,
        "assistance": 300.00,
        "insurance": 82.50
      }
    }
  }
}
```

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | `uuid` | Request tracking ID |
| `isSuccess` | `boolean` | `true` if successful |
| `data.countryIdentifier` | `integer` | Country code (numeric) |
| `data.voucherGroup` | `number` | Group ID for all vouchers in this issuance |
| `data.issuanceDate` | `string` | Issue date - Format: "YYYY/MM/DD" |
| `data.exchangeRate` | `number` | USD to local currency rate |
| `data.vouchers` | `array` | Issued vouchers (one per passenger) |
| `data.paymentDetails` | `object` | Payment confirmation |

#### Voucher Object

| Field | Type | Description |
|-------|------|-------------|
| `code` | `number` | Voucher number (unique) |
| `policyCode` | `string\|null` | Policy certificate number (Brazil/Spain only) |
| `bookingCode` | `string` | Your reference code (echoed from request) |
| `documentNumber` | `string` | Passenger ID document number |
| `lastName` | `string` | Passenger last name |
| `name` | `string` | Passenger first name |
| `ekitURL` | `string` | **Voucher PDF download URL** |
| `policyURL` | `string\|null` | Policy certificate URL (Brazil/Spain only) |
| `productCode` | `string` | Product code |
| `productName` | `string` | Product name |
| `effectiveDateStart` | `string` | Coverage start date |
| `effectiveDateEnd` | `string` | Coverage end date |
| `amountRate` | `object` | Pricing breakdown |

#### Voucher Amount Rate

| Field | Type | Description |
|-------|------|-------------|
| `totalOriginal` | `number` | Price before promotions (USD) |
| `total` | `number` | Final price (USD, excludes financial taxes) |
| `subtotalAssistance` | `number` | Assistance subtotal (Brazil/Spain only) |
| `subtotalInsurance` | `number` | Insurance subtotal (Brazil/Spain only) |
| `financialTaxes` | `number` | Financial taxes |
| `promotionalCode` | `string\|null` | Applied promo code |
| `addons` | `array` | Addon pricing (if any) |

#### Payment Details Object

| Field | Type | Description |
|-------|------|-------------|
| `method` | `string` | Always `"CreditCard"` |
| `brand` | `string` | Card brand code |
| `installments` | `integer` | Number of installments |
| `referenceNumber` | `string` | Payment gateway transaction ID |
| `currency` | `string` | Payment currency |
| `totalPaid` | `number` | Total charged (in local currency) |
| `amountRate` | `object` | USD breakdown |

---

### Response (Error)

**Status**: `400 Bad Request` or `500 Internal Server Error`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": false,
  "errorCode": "PAYMENT_DECLINED",
  "errorMessage": "Credit card payment was declined"
}
```

---

### TypeScript Example

```typescript
// lib/assistcard/issuance.ts

interface IssueVouchersRequest {
  countryCode: string
  agencyCode: string
  branchCode: number
  counterCode: string
  productCode: string
  rateCode: string
  beginDate: string
  endDate: string
  itinerary: {
    code: 'AIRPORT'
    origin: string
    destination: string
  }
  passengers: Array<{
    countryCode: string
    documentType: number
    documentNumber: string
    birthDate: string
    lastname: string
    name: string
    email: string
    phone: string
    preferredSurname?: string
    preferredName?: string
    bookingCode?: string
    addressData: {
      countryCode: string
      streetName: string
      streetNumber: string
      complements?: string
      postalCode: string
      city: string
      state: string
    }
    addons?: Array<{
      code: string
      rateCode: string
      category: number
    }>
  }>
  priceModifiers?: {
    promotionalCode?: string
    markup?: number
    comissionDiscount?: number
  }
  paymentDetails: {
    currency?: string
    amount: number
    installments?: number
    cardNumber: string // Wrapped in {{{ }}}
    cardHolder: string
    expirationDate: string // "MM/YY"
    cvv: string // Wrapped in {{{ }}}
    documentNumber: string
    brand: string
    email: string
    phone?: string
  }
}

interface IssueVouchersResponse {
  traceId: string
  isSuccess: boolean
  data?: {
    countryIdentifier: number
    voucherGroup: number
    issuanceDate: string
    exchangeRate: number
    vouchers: Array<{
      code: number
      policyCode: string | null
      bookingCode: string
      documentNumber: string
      lastName: string
      name: string
      ekitURL: string
      policyURL: string | null
      productCode: string
      productName: string
      effectiveDateStart: string
      effectiveDateEnd: string
      amountRate: {
        totalOriginal: number
        total: number
        subtotalAssistance: number
        subtotalInsurance: number
        financialTaxes: number
        promotionalCode: string | null
        addons: Array<{
          code: string
          rateCode: string
          category: number
          totalOriginal: number
          total: number
          subtotalAssistance: number
          subtotalInsurance: number
          financialTaxes: number
          promotionalCode: string | null
        }>
      }
    }>
    paymentDetails: {
      method: string
      brand: string
      installments: number
      referenceNumber: string
      currency: string
      totalPaid: number
      amountRate: {
        totalOriginal: number
        total: number
        processingFee: number
        financialTaxes: number
        financialInterest: number
        taxesIncluded: number
        noTaxesIncluded: number
        assistance: number
        insurance: number
      }
    }
  }
  errorCode?: string
  errorMessage?: string
}

export async function issueVouchers(
  params: Omit<IssueVouchersRequest, 'countryCode' | 'agencyCode' | 'branchCode'>,
  token: string
): Promise<IssueVouchersResponse['data']> {
  const response = await fetch(
    `${process.env.ASSISTCARD_API_URL}/api/v1/Issuance/credit-card/vouchers`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        countryCode: process.env.ASSISTCARD_COUNTRY_CODE,
        agencyCode: process.env.ASSISTCARD_AGENCY_CODE,
        branchCode: parseInt(process.env.ASSISTCARD_BRANCH_CODE!),
        ...params,
      }),
    }
  )

  const data: IssueVouchersResponse = await response.json()

  if (!response.ok || !data.isSuccess) {
    throw new Error(
      `Policy issuance failed: ${data.errorMessage || 'Unknown error'} (traceId: ${data.traceId})`
    )
  }

  return data.data!
}
```

---

### Complete Flow Example

```typescript
// Complete workflow from client to server

// ===== CLIENT-SIDE (React) =====
async function handlePayment(cardData) {
  // Step 1: Tokenize card data (client-side)
  const { cardNumberToken, cvvToken } = await tokenizeCard(
    cardData.cardNumber,
    cardData.cvv
  )

  // Step 2: Send tokenized data to your Vercel Function
  const response = await fetch('/api/policies/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteId: quote.id,
      agentId: agent.id,
      passengers: passengersData,
      payment: {
        cardNumberToken: `{{{${cardNumberToken}}}}`,
        cvvToken: `{{{${cvvToken}}}}`,
        cardHolder: cardData.holder,
        expirationDate: cardData.expiry,
        brand: cardData.brand,
        amount: totalAmount,
      },
    }),
  })

  const result = await response.json()

  if (result.success) {
    // Show voucher URL to user
    window.location.href = `/voucher/${result.voucherCode}`
  }
}

// ===== SERVER-SIDE (Vercel Function) =====
// api/policies/issue.ts
export default async function handler(req, res) {
  try {
    const token = await getValidToken()

    // Call Assistcard Issue API
    const issuanceData = await issueVouchers(
      {
        counterCode: req.body.agentId,
        productCode: req.body.productCode,
        rateCode: req.body.rateCode,
        beginDate: req.body.beginDate,
        endDate: req.body.endDate,
        itinerary: req.body.itinerary,
        passengers: req.body.passengers,
        paymentDetails: {
          amount: req.body.payment.amount,
          cardNumber: req.body.payment.cardNumberToken, // Already wrapped
          cvv: req.body.payment.cvvToken, // Already wrapped
          cardHolder: req.body.payment.cardHolder,
          expirationDate: req.body.payment.expirationDate,
          brand: req.body.payment.brand,
          documentNumber: req.body.passengers[0].documentNumber,
          email: req.body.payment.email || req.body.passengers[0].email,
        },
      },
      token
    )

    // Save policy to database
    const policy = await supabase.from('policies').insert({
      quote_id: req.body.quoteId,
      agent_id: req.body.agentId,
      client_id: req.body.passengers[0].clientId,
      voucher_code: issuanceData.vouchers[0].code.toString(),
      voucher_group: issuanceData.voucherGroup.toString(),
      ekit_url: issuanceData.vouchers[0].ekitURL,
      // ... other fields
    })

    return res.json({
      success: true,
      voucherCode: issuanceData.vouchers[0].code,
      voucherUrl: issuanceData.vouchers[0].ekitURL,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
```

---

### Important Notes

**PCI Compliance**:
- Card tokenization must happen **client-side** using TokenEx
- Never send raw card numbers to your server
- Store tokenized values wrapped in triple braces: `{{{token}}}`
- Requires PCI DSS certification (AOC or SAQ-D documentation)

**Counter Code**:
- Use agent ID for tracking sales
- Enables commission attribution
- For B2C (no specific agent), use a fixed generic value

**Max Passengers**:
- Maximum 16 passengers per request
- For larger groups, split into multiple requests

**Document Type**:
- Default: `1` (Passport - generic) for all countries except Brazil/Spain
- Allows alphanumeric document numbers
- Brazil/Spain: See special requirements in Assistcard docs

**Brazil/Spain Special Requirements**:
- `policyCode` returned (policy certificate number)
- `policyURL` returned (certificate download)
- Address data must be real/verified
- Social names (`preferredName`/`preferredSurname`) available

**Payment Amount**:
- Must include financial interest (if installments > 1)
- System validates amount matches quoted price
- Use 2 decimal places

**Tokenized Data Format**:
```javascript
// Correct
cardNumber: "{{{400000Cpcp3Q1091}}}"

// Wrong
cardNumber: "400000Cpcp3Q1091"
cardNumber: "{{400000Cpcp3Q1091}}"
```

**Response URLs**:
- `ekitURL`: Voucher document (PDF) - **Give this to the customer**
- `policyURL`: Policy certificate (Brazil/Spain only)
- Store these URLs in your database (don't download PDFs)

**Workflow Summary**:
1. Quote Products → Get available plans
2. User selects product
3. Quote Addons → Get optional upgrades (optional)
4. User selects addons (optional)
5. Collect full passenger details + payment
6. **Tokenize card (client-side)**
7. **Issue policy (server-side)** with tokenized data
8. Save voucher data to database
9. Display voucher URL to customer

---

## Cancel Voucher

Cancel/void an issued voucher.

**Purpose**: Annul a specific voucher code from an issuance event. Used for refunds, incorrect data, or voiding test vouchers.

**Endpoint**: `POST /api/v1/Voucher/cancelVoucher`

**Authentication**: Bearer token required

**Headers**:
```
Content-Type: application/json
Accept: text/plain
Authorization: Bearer <token>
```

---

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `countryCode` | `string` | ✅ | ISO 3166-1 alpha-2 country code |
| `voucherCode` | `number` | ✅ | Voucher number to cancel |
| `reason` | `string` | ✅ (Spain only) | Cancellation reason code |

#### Cancellation Reasons (Spain only)

| Code | Description |
|------|-------------|
| `CancelationTrip` | Trip cancelled |
| `IncorrectData` | Incorrect passenger/travel data |
| `VisaDenial` | Visa denied |
| `TestVoucher` | Test voucher to be voided |
| `DuplicateVoucher` | Duplicate voucher |
| `IllnessAccident` | Passenger illness or accident |
| `FamilyIllnessAccident` | Family illness or accident |
| `FamilyDeath` | Family death |
| `AdjustmentDifferences` | Price/billing adjustment |
| `VisaCancelation` | Visa cancellation |

---

### Request Body Example

```json
{
  "countryCode": "AR",
  "voucherCode": 123456789
}
```

**With reason (Spain)**:
```json
{
  "countryCode": "ES",
  "voucherCode": 987654321,
  "reason": "IncorrectData"
}
```

---

### Response (Success)

**Status**: `200 OK`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": true,
  "data": {
    "voucher": 123456789
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | `uuid` | Request tracking ID |
| `isSuccess` | `boolean` | `true` if successful |
| `data.voucher` | `number` | Cancelled voucher code (confirmation) |

---

### Response (Error)

**Status**: `400 Bad Request` or `404 Not Found`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": false,
  "errorCode": "VOUCHER_NOT_FOUND",
  "errorMessage": "Voucher code does not exist"
}
```

**Common Error Codes**:
- `VOUCHER_NOT_FOUND`: Voucher doesn't exist
- `VOUCHER_ALREADY_CANCELLED`: Voucher already voided
- `VOUCHER_EXPIRED`: Voucher coverage period ended
- `INVALID_REASON`: Invalid reason code (Spain)

---

### TypeScript Example

```typescript
// lib/assistcard/voucher.ts

interface CancelVoucherRequest {
  countryCode: string
  voucherCode: number
  reason?:
    | 'CancelationTrip'
    | 'IncorrectData'
    | 'VisaDenial'
    | 'TestVoucher'
    | 'DuplicateVoucher'
    | 'IllnessAccident'
    | 'FamilyIllnessAccident'
    | 'FamilyDeath'
    | 'AdjustmentDifferences'
    | 'VisaCancelation'
}

interface CancelVoucherResponse {
  traceId: string
  isSuccess: boolean
  data?: {
    voucher: number
  }
  errorCode?: string
  errorMessage?: string
}

export async function cancelVoucher(
  voucherCode: number,
  reason?: CancelVoucherRequest['reason'],
  token?: string
): Promise<number> {
  const authToken = token || (await getValidToken())

  const response = await fetch(
    `${process.env.ASSISTCARD_API_URL}/api/v1/Voucher/cancelVoucher`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        countryCode: process.env.ASSISTCARD_COUNTRY_CODE,
        voucherCode,
        ...(reason && { reason }),
      }),
    }
  )

  const data: CancelVoucherResponse = await response.json()

  if (!response.ok || !data.isSuccess) {
    throw new Error(
      `Voucher cancellation failed: ${data.errorMessage || 'Unknown error'} (traceId: ${data.traceId})`
    )
  }

  return data.data!.voucher
}
```

**Usage**:
```typescript
// In Vercel Function
export default async function handler(req, res) {
  try {
    const { voucherCode, reason } = req.body

    // Cancel voucher in Assistcard
    const cancelledVoucher = await cancelVoucher(voucherCode, reason)

    // Update policy in database
    await supabase
      .from('policies')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('voucher_code', voucherCode.toString())

    // Log the cancellation
    await supabase.from('audit_logs').insert({
      user_id: req.userId,
      action: 'policy_cancelled',
      resource_type: 'policy',
      resource_id: policyId,
      metadata: {
        voucher_code: voucherCode,
        reason,
      },
    })

    return res.json({
      success: true,
      cancelledVoucher,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
```

---

### Important Notes

**When to Cancel**:
- Customer requests refund before trip
- Incorrect passenger/travel data entered
- Duplicate issuance by mistake
- Test vouchers that need to be voided

**Refund Policy**:
- Check Assistcard's refund policy before cancelling
- May have penalties or blackout periods
- Refund processing is separate from cancellation

**Database Updates**:
- Don't delete the policy record (for audit trail)
- Add `status` and `cancelled_at` fields to policies table
- Log cancellation in audit_logs

**Spain Point Emisor**:
- `reason` parameter is **mandatory**
- Must use one of the approved reason codes
- Other countries: `reason` is optional

**Cannot Cancel**:
- Vouchers already used (assistance rendered)
- Vouchers past effective end date (expired)
- Previously cancelled vouchers

---

## Rectify Validity

Modify a voucher's start date and/or email before coverage begins.

**Purpose**: Update the effective start date or passenger email for an issued voucher. Used when travel dates change or email correction is needed.

**Constraints**:
- Voucher **must not have started** (effectiveDateStart must be in the future)
- At least **one** of `effectiveDateStart` or `email` must be provided
- Coverage duration (days) remains the same - only start date shifts

**Endpoint**: `POST /api/v1/Voucher/rectifyValidity`

**Authentication**: Bearer token required

**Headers**:
```
Content-Type: application/json
Accept: text/plain
Authorization: Bearer <token>
```

---

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `countryCode` | `string` | ✅ | ISO 3166-1 alpha-2 country code |
| `voucherCode` | `number` | ✅ | Voucher number to modify |
| `effectiveDateStart` | `string` | ⚠️ | New start date - Format: "YYYY/MM/DD" |
| `email` | `string` | ⚠️ | New passenger email |

**Important**: At least one of `effectiveDateStart` or `email` must be provided (not both optional).

---

### Request Body Examples

**Change start date only**:
```json
{
  "countryCode": "AR",
  "voucherCode": 123456789,
  "effectiveDateStart": "2025/02/15"
}
```

**Change email only**:
```json
{
  "countryCode": "AR",
  "voucherCode": 123456789,
  "email": "newemail@example.com"
}
```

**Change both**:
```json
{
  "countryCode": "AR",
  "voucherCode": 123456789,
  "effectiveDateStart": "2025/02/15",
  "email": "newemail@example.com"
}
```

---

### Response (Success)

**Status**: `200 OK`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": true,
  "data": {
    "countryIdentifier": 54,
    "voucherGroup": 987654321,
    "issuanceDate": "2025/01/16",
    "exchangeRate": 1050.50,
    "voucher": {
      "status": "Activo",
      "code": 123456789,
      "policyCode": null,
      "bookingCode": "BK123456",
      "documentNumber": "12345678",
      "lastName": "García",
      "name": "Juan",
      "preferredName": null,
      "preferredSurname": null,
      "ekitURL": "https://documents.assistcard.com/voucher/123456789",
      "policyURL": null,
      "productCode": "AC",
      "productName": "AC 150",
      "effectiveDateStart": "2025/02/15",
      "effectiveDateEnd": "2025/03/01",
      "amountRate": {
        "totalOriginal": 450.00,
        "total": 382.50,
        "subtotalAssistance": 300.00,
        "subtotalInsurance": 82.50,
        "financialTaxes": 0.00,
        "promotionId": null,
        "addons": []
      }
    }
  }
}
```

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | `uuid` | Request tracking ID |
| `isSuccess` | `boolean` | `true` if successful |
| `data.countryIdentifier` | `integer` | Country code (numeric) |
| `data.voucherGroup` | `number` | Voucher group ID |
| `data.issuanceDate` | `string` | Original issuance date |
| `data.exchangeRate` | `number` | Exchange rate |
| `data.voucher` | `object` | Updated voucher data |

#### Updated Voucher Object

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Voucher status (e.g., "Activo", "Anulado") |
| `code` | `number` | Voucher number |
| `effectiveDateStart` | `string` | **Updated** start date |
| `effectiveDateEnd` | `string` | **Recalculated** end date (preserves duration) |
| `ekitURL` | `string` | Voucher PDF URL (may be regenerated) |
| ...other fields | | Same as Issue Policy response |

---

### Response (Error)

**Status**: `400 Bad Request`

```json
{
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "isSuccess": false,
  "errorCode": "VOUCHER_ALREADY_STARTED",
  "errorMessage": "Cannot modify voucher that has already started"
}
```

**Common Error Codes**:
- `VOUCHER_NOT_FOUND`: Voucher doesn't exist
- `VOUCHER_ALREADY_STARTED`: Coverage already began (cannot modify)
- `VOUCHER_CANCELLED`: Cannot modify cancelled vouchers
- `MISSING_REQUIRED_FIELD`: Neither effectiveDateStart nor email provided
- `INVALID_DATE`: New start date is in the past

---

### TypeScript Example

```typescript
// lib/assistcard/voucher.ts

interface RectifyValidityRequest {
  countryCode: string
  voucherCode: number
  effectiveDateStart?: string // "YYYY/MM/DD"
  email?: string
}

interface RectifyValidityResponse {
  traceId: string
  isSuccess: boolean
  data?: {
    countryIdentifier: number
    voucherGroup: number
    issuanceDate: string
    exchangeRate: number
    voucher: {
      status: string
      code: number
      policyCode: string | null
      bookingCode: string
      documentNumber: string
      lastName: string
      name: string
      preferredName: string | null
      preferredSurname: string | null
      ekitURL: string
      policyURL: string | null
      productCode: string
      productName: string
      effectiveDateStart: string
      effectiveDateEnd: string
      amountRate: {
        totalOriginal: number
        total: number
        subtotalAssistance: number
        subtotalInsurance: number
        financialTaxes: number
        promotionId: number | null
        addons: Array<any>
      }
    }
  }
  errorCode?: string
  errorMessage?: string
}

export async function rectifyValidity(
  voucherCode: number,
  updates: {
    effectiveDateStart?: string
    email?: string
  },
  token?: string
): Promise<RectifyValidityResponse['data']> {
  // Validate at least one field provided
  if (!updates.effectiveDateStart && !updates.email) {
    throw new Error('Must provide at least one of: effectiveDateStart or email')
  }

  const authToken = token || (await getValidToken())

  const response = await fetch(
    `${process.env.ASSISTCARD_API_URL}/api/v1/Voucher/rectifyValidity`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        countryCode: process.env.ASSISTCARD_COUNTRY_CODE,
        voucherCode,
        ...updates,
      }),
    }
  )

  const data: RectifyValidityResponse = await response.json()

  if (!response.ok || !data.isSuccess) {
    throw new Error(
      `Voucher rectification failed: ${data.errorMessage || 'Unknown error'} (traceId: ${data.traceId})`
    )
  }

  return data.data!
}
```

**Usage**:
```typescript
// Example: Customer's trip delayed by 10 days
export default async function handler(req, res) {
  try {
    const { voucherCode, newStartDate, newEmail } = req.body

    // Update voucher in Assistcard
    const updatedVoucher = await rectifyValidity(voucherCode, {
      effectiveDateStart: newStartDate,
      email: newEmail,
    })

    // Update policy in database
    await supabase
      .from('policies')
      .update({
        begin_date: updatedVoucher.voucher.effectiveDateStart,
        end_date: updatedVoucher.voucher.effectiveDateEnd,
        ekit_url: updatedVoucher.voucher.ekitURL, // May be regenerated
        updated_at: new Date().toISOString(),
      })
      .eq('voucher_code', voucherCode.toString())

    // Update client email if changed
    if (newEmail) {
      await supabase
        .from('clients')
        .update({ email: newEmail })
        .eq('id', policyClientId)
    }

    // Log the modification
    await supabase.from('audit_logs').insert({
      user_id: req.userId,
      action: 'policy_rectified',
      resource_type: 'policy',
      resource_id: policyId,
      metadata: {
        voucher_code: voucherCode,
        old_start_date: oldStartDate,
        new_start_date: newStartDate,
        email_changed: !!newEmail,
      },
    })

    return res.json({
      success: true,
      voucher: updatedVoucher.voucher,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
```

---

### Important Notes

**Date Modification Logic**:
- Original: Feb 1-15 (15 days)
- Update start to Feb 15
- New dates: Feb 15-Mar 1 (15 days preserved)
- End date automatically recalculated

**When to Use**:
- Customer's travel dates changed before trip
- Email typo correction
- Customer provided wrong email

**Restrictions**:
- Cannot modify voucher that already started
- Cannot modify cancelled vouchers
- Cannot change coverage duration (only shift dates)
- Start date must be in the future

**Email Update**:
- Updates where the voucher PDF is sent
- Customer receives updated voucher at new email
- Consider sending notification to both old and new email

**Database Sync**:
- Update `begin_date` and `end_date` in policies table
- Update `ekit_url` (Assistcard may regenerate PDF with new dates)
- Update client email if changed
- Log modification in audit_logs

**Multiple Passengers**:
- Call this endpoint **once per voucher**
- If a group booking's dates change, call for each voucher code
- All vouchers in same group should be updated together

---

**Document Version**: 1.0
**Last Updated**: 2025-01-16
