# Travel Trip Planner

A small, framework-free travel planning website built with HTML, CSS, vanilla JavaScript, Express, and MongoDB.

## Requirements

- Node.js 18 or later
- MongoDB running locally, or a MongoDB connection string

## Run locally

1. Install the packages:

   ```powershell
   npm.cmd install
   ```

2. Copy `.env.example` to `.env`. Update `MONGODB_URI` if your MongoDB instance uses a different address. Configure email settings to send trip notifications to the email address provided by the traveler. Set a private `ADMIN_API_KEY` to enable status updates.

3. Start the app:

   ```powershell
   npm.cmd start
   ```

4. Open <http://localhost:3000>.

The first server start adds the ten example destinations to the `travel_planner` database when the destinations collection is empty. Destinations, agency negotiation requests, and confirmed trips are stored in MongoDB.

## Main pages

- `/` — home and featured destinations
- `/destinations.html` — destination catalog
- `/details.html?id=...` — destination details and available plans
- `/plans.html?id=...` — choose Basic, Standard, or Premium
- `/negotiate.html` — send a package request to the agency
- `/confirm.html` — confirm a trip and receive a unique Trip ID
- `/mytrips.html` — find trips by email or Trip ID
- `/contact.html` — contact the travel team by email or phone
- `/admin.html` — add destinations and view agency requests

Plan prices are per person: Basic uses the destination's starting price, Standard is 1.5 times the starting price, and Premium is twice the starting price. The trip confirmation form accepts a final total so a traveler can use a negotiated amount.

## API

- `GET /api/destinations`
- `POST /api/destinations`
- `GET /api/destinations/:id`
- `POST /api/negotiations`
- `GET /api/negotiations`
- `POST /api/trips`
- `GET /api/trips?email=...`
- `GET /api/trips/:id` (MongoDB ObjectId or generated Trip ID)
- `POST /api/trips/:id/reminder` (JSON body: `{ "email": "booking-email@example.com" }`)
- `PATCH /api/trips/:id/status` (requires the `x-admin-api-key` header)

## Trip confirmation notifications

Trip confirmations, status changes, and requested reminders are sent only by email, to the email address supplied by the traveler when booking. Email uses an HTML trip-details template; the My Trips page also lets the traveler request a reminder. To reduce abuse, the booking email must match and reminders are limited to one per trip every 24 hours.

Configure email delivery:

- Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, and optionally `EMAIL_FROM`. Gmail accounts should use a Google app password rather than the account password.

The trip confirmation response and reminder result report email as `sent`, `failed`, or `not configured` with the missing environment variable names. A failed email does not undo a saved trip or status change; failures are logged by the server.

### Trip status changes

Set `ADMIN_API_KEY` in the server's `.env`. Status updates are disabled if this secret is not configured. Keep it private and call the endpoint from a trusted admin environment:

```powershell
$headers = @{ "x-admin-api-key" = "your-private-admin-api-key" }
$body = @{ status = "Completed" } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/api/trips/TRIP_ID/status" -Headers $headers -Body $body -ContentType "application/json"
```

Allowed statuses are `Confirmed`, `Cancelled`, and `Completed`. An email notification is sent only when the status actually changes.
