# YieldVibe API Documentation

## Webhook API Reference

The YieldVibe Webhook API allows external tools like n8n, Zapier, and Make.com to interact with your property management system.

---

## Authentication

All webhook endpoints require API key authentication.

### Obtaining an API Key

1. Navigate to **Settings** → **API Keys** tab
2. Click **Generate Key**
3. Save the key securely (it's only shown once!)

### Using Your API Key

Include the API key in request headers:

**Option 1: Authorization Header**
```
Authorization: Bearer yvb_xxxxxxxxxxxxx
```

**Option 2: X-API-Key Header**
```
X-API-Key: yvb_xxxxxxxxxxxxx
```

### Permissions

- **Read Only**: Can fetch data (GET requests)
- **Read & Write**: Can fetch and create data (GET, POST requests)

---

## Base URL

```
https://your-domain.vercel.app
```

---

## Endpoints

### 1. Bookings

#### GET /api/webhooks/booking

List recent bookings with pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default: 50, max: 100) |
| `offset` | number | Skip results for pagination |
| `status` | string | Filter by status: `confirmed`, `cancelled`, `refunded` |
| `property_id` | string | Filter by property UUID |

**Example Request:**
```bash
curl -X GET "https://your-app.vercel.app/api/webhooks/booking?limit=10&status=confirmed" \
  -H "Authorization: Bearer yvb_xxxxx"
```

**Example Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": "uuid",
      "guest_name": "John Smith",
      "guest_email": "john@example.com",
      "check_in": "2024-02-15",
      "check_out": "2024-02-18",
      "total_paid": 450.00,
      "status": "confirmed",
      "channel": "direct",
      "guests": 2,
      "created_at": "2024-02-10T10:30:00Z",
      "room_type": "Deluxe Suite",
      "room_name": "Room 101",
      "property_name": "Beach House",
      "property_id": "uuid"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 45,
    "hasMore": true
  }
}
```

---

#### POST /api/webhooks/booking

Create a new booking.

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `room_id` | string | UUID of the room |
| `guest_name` | string | Guest's full name |
| `check_in` | string | Check-in date (YYYY-MM-DD) |
| `check_out` | string | Check-out date (YYYY-MM-DD) |
| `total_paid` | number | Total amount paid |

**Optional Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `guest_email` | string | Guest's email address |
| `status` | string | Booking status (default: `confirmed`) |
| `channel` | string | Booking source (default: `webhook`) |
| `guests` | number | Number of guests (default: 1) |
| `notes` | string | Additional notes |

**Example Request:**
```bash
curl -X POST "https://your-app.vercel.app/api/webhooks/booking" \
  -H "Authorization: Bearer yvb_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "550e8400-e29b-41d4-a716-446655440000",
    "guest_name": "Jane Doe",
    "guest_email": "jane@example.com",
    "check_in": "2024-03-01",
    "check_out": "2024-03-05",
    "total_paid": 600.00,
    "guests": 2,
    "channel": "zapier"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "booking": {
    "id": "new-uuid",
    "room_id": "550e8400-e29b-41d4-a716-446655440000",
    "guest_name": "Jane Doe",
    "guest_email": "jane@example.com",
    "check_in": "2024-03-01",
    "check_out": "2024-03-05",
    "total_paid": 600.00,
    "status": "confirmed",
    "channel": "zapier",
    "guests": 2,
    "created_at": "2024-02-20T14:30:00Z"
  },
  "message": "Booking created successfully"
}
```

---

### 2. Availability

#### GET /api/webhooks/availability

Check room availability for a date range.

**Required Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `check_in` | string | Start date (YYYY-MM-DD) |
| `check_out` | string | End date (YYYY-MM-DD) |

**Optional Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `room_id` | string | Check specific room |
| `property_id` | string | Filter by property |

**Example Request:**
```bash
curl -X GET "https://your-app.vercel.app/api/webhooks/availability?check_in=2024-03-01&check_out=2024-03-05" \
  -H "Authorization: Bearer yvb_xxxxx"
```

**Example Response:**
```json
{
  "success": true,
  "query": {
    "check_in": "2024-03-01",
    "check_out": "2024-03-05",
    "nights": 4
  },
  "summary": {
    "total_rooms": 10,
    "available": 7,
    "unavailable": 3
  },
  "rooms": [
    {
      "room_id": "uuid",
      "room_name": "Ocean View Suite",
      "room_type": "suite",
      "property_id": "uuid",
      "property_name": "Beach Resort",
      "max_guests": 4,
      "is_available": true,
      "conflicts": [],
      "pricing": {
        "base_price_per_night": 150.00,
        "nights": 4,
        "estimated_total": 600.00,
        "currency": "USD"
      }
    },
    {
      "room_id": "uuid",
      "room_name": "Garden Room",
      "is_available": false,
      "conflicts": [
        {
          "booking_id": "uuid",
          "check_in": "2024-02-28",
          "check_out": "2024-03-03",
          "guest_name": "Existing Guest"
        }
      ]
    }
  ]
}
```

---

### 3. Rooms

#### GET /api/webhooks/rooms

List all rooms with current occupancy status.

**Optional Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `property_id` | string | Filter by property |
| `include_inactive` | boolean | Include inactive rooms |

**Example Request:**
```bash
curl -X GET "https://your-app.vercel.app/api/webhooks/rooms" \
  -H "Authorization: Bearer yvb_xxxxx"
```

**Example Response:**
```json
{
  "success": true,
  "total_rooms": 10,
  "occupied": 3,
  "available": 7,
  "rooms": [
    {
      "id": "uuid",
      "name": "Ocean View Suite",
      "room_type": "suite",
      "base_price": 150.00,
      "max_guests": 4,
      "amenities": ["wifi", "ac", "minibar"],
      "is_active": true,
      "property": {
        "id": "uuid",
        "name": "Beach Resort",
        "city": "Miami",
        "country": "USA"
      },
      "status": {
        "is_occupied": true,
        "current_guest": "John Smith",
        "current_booking": {
          "id": "uuid",
          "check_in": "2024-02-18",
          "check_out": "2024-02-22"
        }
      }
    }
  ],
  "by_property": [
    {
      "property": {
        "id": "uuid",
        "name": "Beach Resort"
      },
      "rooms": [...],
      "summary": {
        "total": 5,
        "occupied": 2,
        "available": 3
      }
    }
  ]
}
```

---

### 4. Revenue

#### GET /api/webhooks/revenue

Get revenue summary and statistics.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year`, `custom` |
| `start_date` | string | Start date for custom period (YYYY-MM-DD) |
| `end_date` | string | End date for custom period (YYYY-MM-DD) |
| `property_id` | string | Filter by property |

**Example Request:**
```bash
curl -X GET "https://your-app.vercel.app/api/webhooks/revenue?period=month" \
  -H "Authorization: Bearer yvb_xxxxx"
```

**Example Response:**
```json
{
  "success": true,
  "period": {
    "type": "month",
    "start_date": "2024-01-20",
    "end_date": "2024-02-20"
  },
  "summary": {
    "total_revenue": 15000.00,
    "total_refunds": 500.00,
    "net_revenue": 14500.00,
    "total_bookings": 25,
    "confirmed_bookings": 23,
    "refunded_bookings": 2,
    "average_booking_value": 600.00,
    "rooms_booked": 8,
    "currency": "USD"
  },
  "by_channel": [
    {
      "channel": "direct",
      "revenue": 8000.00,
      "bookings": 12,
      "percentage": "53.3"
    },
    {
      "channel": "airbnb",
      "revenue": 5000.00,
      "bookings": 10,
      "percentage": "33.3"
    },
    {
      "channel": "booking.com",
      "revenue": 2000.00,
      "bookings": 3,
      "percentage": "13.3"
    }
  ],
  "daily_breakdown": [
    {
      "date": "2024-02-19",
      "revenue": 450.00,
      "bookings": 1
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**HTTP Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created (POST success) |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (missing/invalid API key) |
| 403 | Forbidden (insufficient permissions) |
| 500 | Server Error |

---

## Rate Limiting

Currently no rate limiting is enforced. Please be respectful with request frequency.

Recommended: Max 60 requests/minute.

---

## Integration Examples

### n8n Workflow

1. Add HTTP Request node
2. Set Method: GET or POST
3. URL: `https://your-app.vercel.app/api/webhooks/booking`
4. Authentication: Header Auth
   - Name: `Authorization`
   - Value: `Bearer YOUR_API_KEY`

### Zapier Integration

1. Use "Webhooks by Zapier" app
2. Choose "Custom Request"
3. Add header: `Authorization: Bearer YOUR_API_KEY`

### Make.com (Integromat)

1. Use HTTP module
2. Add header for authentication
3. Parse JSON response

---

## Changelog

### v1.0.0
- Initial webhook API release
- Endpoints: booking, availability, rooms, revenue
- API key authentication
