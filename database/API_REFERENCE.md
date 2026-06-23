// ============================================
// TOUR BOOKING API REFERENCE
// ============================================

// ─────────────────────────────────────────
// 1. CREATE TOUR BOOKING (POST)
// ─────────────────────────────────────────

Endpoint: POST /api/tour-bookings

Request Body:
{
  "tourId": 5,                              // (Required) ID of the tour
  "tourName": "Goa Beach Escape",           // (Required) Name of tour package
  "destination": "Goa",                     // (Required) Destination name
  "customerName": "Raj Kumar",              // (Required) Full name
  "email": "raj@example.com",               // (Required) Email address
  "phone": "+919876543210",                 // (Required) Phone number
  "passengers": 4,                          // (Required) Number of people
  "startDate": "2026-07-15",                // (Required) Tour start date (YYYY-MM-DD)
  "duration": "3D/2N",                      // (Required) Duration string
  "amount": 24000,                          // (Required) Total amount (passengers × price)
  "pricePerPerson": 6000,                   // (Required) Price per person
  "specialRequests": "Vegetarian meals",    // (Optional) Special requests
  "bookingType": "tour",                    // (Default: 'tour') Booking type
  "paymentStatus": "Pending",               // (Default: 'Pending') Payment status
  "bookingStatus": "Confirmed"              // (Default: 'Confirmed') Booking status
}

Response (201 Created):
{
  "id": 42,
  "bookingId": "PT1719158400",
  "tourId": 5,
  "tourName": "Goa Beach Escape",
  "customerName": "Raj Kumar",
  "email": "raj@example.com",
  "phone": "+919876543210",
  "passengers": 4,
  "travelDate": "2026-07-15",
  "amount": 24000,
  "pricePerPerson": 6000,
  "paymentStatus": "Pending",
  "bookingStatus": "Confirmed",
  "specialRequests": "Vegetarian meals",
  "createdAt": "2026-06-23T10:30:00.000Z"
}


// ─────────────────────────────────────────
// 2. GET ALL TOUR BOOKINGS (GET)
// ─────────────────────────────────────────

Endpoint: GET /api/tour-bookings

Response (200 OK):
[
  {
    "id": 42,
    "bookingId": "PT1719158400",
    "tourId": 5,
    "tourName": "Goa Beach Escape",
    "customerName": "Raj Kumar",
    "email": "raj@example.com",
    "phone": "+919876543210",
    "passengers": 4,
    "travelDate": "2026-07-15",
    "amount": 24000,
    "paymentStatus": "Pending",
    "bookingStatus": "Confirmed",
    "createdAt": "2026-06-23T10:30:00.000Z"
  },
  // ... more bookings
]


// ─────────────────────────────────────────
// 3. GET SPECIFIC TOUR BOOKING (GET)
// ─────────────────────────────────────────

Endpoint: GET /api/tour-bookings/[id]

Example: GET /api/tour-bookings/42

Response (200 OK):
{
  "id": 42,
  "bookingId": "PT1719158400",
  "tourId": 5,
  "tourName": "Goa Beach Escape",
  "customerName": "Raj Kumar",
  "email": "raj@example.com",
  "phone": "+919876543210",
  "passengers": 4,
  "travelDate": "2026-07-15",
  "amount": 24000,
  "paymentStatus": "Pending",
  "bookingStatus": "Confirmed",
  "specialRequests": "Vegetarian meals",
  "createdAt": "2026-06-23T10:30:00.000Z"
}


// ─────────────────────────────────────────
// 4. UPDATE TOUR BOOKING (PUT)
// ─────────────────────────────────────────

Endpoint: PUT /api/tour-bookings/[id]

Example: PUT /api/tour-bookings/42

Request Body (Update any of these):
{
  "bookingStatus": "Confirmed",    // Change status
  "paymentStatus": "Paid",         // Mark as paid
  "specialRequests": "New request" // Update special requests
}

Response (200 OK):
{
  "id": 42,
  "bookingStatus": "Confirmed",
  "paymentStatus": "Paid",
  "specialRequests": "New request",
  // ... other fields unchanged
}


// ─────────────────────────────────────────
// 5. DELETE TOUR BOOKING (DELETE)
// ─────────────────────────────────────────

Endpoint: DELETE /api/tour-bookings/[id]

Example: DELETE /api/tour-bookings/42

Response (200 OK):
{
  "message": "Tour booking deleted successfully"
}


// ============================================
// DATABASE SCHEMA REFERENCE
// ============================================

Table: bookings

For Tour Bookings, these columns are populated:
┌─────────────────────┬──────────────────────┬──────────────────────┐
│ Column              │ Type                 │ Example Value        │
├─────────────────────┼──────────────────────┼──────────────────────┤
│ id                  │ BIGINT (PK)          │ 42                   │
│ booking_id          │ UUID                 │ PT1719158400         │
│ booking_type        │ TEXT                 │ 'tour'               │
│ tour_id             │ BIGINT (FK)          │ 5                    │
│ tour_name           │ TEXT                 │ 'Goa Beach Escape'   │
│ customer_name       │ TEXT                 │ 'Raj Kumar'          │
│ email               │ TEXT                 │ 'raj@example.com'    │
│ phone               │ TEXT                 │ '+919876543210'      │
│ destination         │ TEXT                 │ 'Goa'                │
│ travel_date         │ DATE                 │ 2026-07-15           │
│ passengers          │ INTEGER              │ 4                    │
│ amount              │ NUMERIC              │ 24000                │
│ price_per_person    │ NUMERIC              │ 6000                 │
│ payment_status      │ TEXT                 │ 'Pending'/'Paid'     │
│ booking_status      │ TEXT                 │ 'Confirmed'          │
│ special_requests    │ TEXT                 │ 'Vegetarian meals'   │
│ created_at          │ TIMESTAMP            │ 2026-06-23 10:30:00  │
│ driver_id           │ BIGINT (NULL)        │ NULL                 │
└─────────────────────┴──────────────────────┴──────────────────────┘


// ============================================
// SAMPLE CURL REQUESTS
// ============================================

// Create booking
curl -X POST http://localhost:5173/api/tour-bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tourId": 5,
    "tourName": "Goa Beach Escape",
    "destination": "Goa",
    "customerName": "Raj Kumar",
    "email": "raj@example.com",
    "phone": "+919876543210",
    "passengers": 4,
    "startDate": "2026-07-15",
    "duration": "3D/2N",
    "amount": 24000,
    "pricePerPerson": 6000,
    "specialRequests": "Vegetarian meals"
  }'

// Get all tour bookings
curl http://localhost:5173/api/tour-bookings

// Get specific booking
curl http://localhost:5173/api/tour-bookings/42

// Update booking status
curl -X PUT http://localhost:5173/api/tour-bookings/42 \
  -H "Content-Type: application/json" \
  -d '{
    "bookingStatus": "Confirmed",
    "paymentStatus": "Paid"
  }'

// Delete booking
curl -X DELETE http://localhost:5173/api/tour-bookings/42
