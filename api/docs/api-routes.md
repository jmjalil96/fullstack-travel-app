# API Routes

## Quoting Wizard

- [x] `POST /api/assistcard/quote/products` - Get available insurance products
- [x] `POST /api/assistcard/quote/addons` - Get optional addons for selected product
- [x] `POST /api/policies/issue` - Issue vouchers + save to DB (atomic)
- [x] `POST /api/quotes` - Save quote
- [x] `GET /api/quotes/:id` - Load saved quote
- [ ] `GET /api/quotes` - List agent's quotes
- [ ] `DELETE /api/quotes/:id` - Delete quote
- [ ] `GET /api/quotes/:id/pdf` - Generate quote PDF
- [ ] `POST /api/policies/issue` - Issue policy + save to DB

## Dashboard

- [ ] `GET /api/dashboard/stats` - Overview stats (policies, revenue, commissions)
- [ ] `GET /api/dashboard/charts/policies-over-time` - Policies chart data
- [ ] `GET /api/dashboard/charts/products-sold` - Products chart data
- [ ] `GET /api/dashboard/charts/destinations` - Destinations chart data

## Policies

- [ ] `GET /api/policies` - List agent's policies
- [ ] `GET /api/policies/:id` - Policy details
- [ ] `GET /api/policies/:id/voucher` - Download voucher PDF
- [ ] `POST /api/policies/:id/cancel` - Cancel policy
- [ ] `POST /api/policies/:id/rectify` - Update dates/email
- [ ] `GET /api/policies/search` - Search policies

## Passengers

- [ ] `GET /api/passengers` - List passengers
- [ ] `GET /api/passengers/:id` - Passenger details
- [ ] `POST /api/passengers` - Create passenger
- [ ] `PATCH /api/passengers/:id` - Update passenger
- [ ] `DELETE /api/passengers/:id` - Soft delete passenger
- [ ] `GET /api/passengers/search` - Search passengers
- [ ] `GET /api/passengers/:id/policies` - Passenger's policy history

## Commissions

- [ ] `GET /api/commissions` - List agent's commissions
- [ ] `GET /api/commissions/:id` - Commission details
- [ ] `GET /api/commissions/summary` - Earnings summary

---

**Total: 29 routes**
