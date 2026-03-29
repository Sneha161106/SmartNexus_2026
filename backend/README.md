# Expense Reimbursement Backend

Production-ready Express + MongoDB backend for the existing single-page Expense Reimbursement frontend.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT auth
- bcrypt password hashing
- Multer file uploads
- dotenv configuration
- express-validator input validation
- Winston logging
- Swagger docs
- Redis-ready caching with in-memory fallback
- Nodemailer-ready email notifications

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── app.js
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
└── server.js
```

## Setup

1. Copy `.env.example` to `.env`
2. Update `MONGODB_URI`, `JWT_SECRET`, and any optional SMTP/Redis settings
3. Install dependencies:

```bash
npm install
```

4. Start the API:

```bash
npm run dev
```

The API runs on `http://localhost:5001` by default.

## Docker

```bash
docker compose up --build
```

## API Docs

Swagger UI is available at:

```text
http://localhost:5001/api/docs
```

## Key Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Expenses

- `GET /api/expenses`
- `GET /api/expenses/:id`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `POST /api/expenses/:id/approve`
- `POST /api/expenses/:id/reject`

### Workflows

- `GET /api/workflows`
- `POST /api/workflows`

### Notifications

- `GET /api/notifications`
- `POST /api/notifications`

### Audit

- `GET /api/audit`

## Frontend Integration Notes

The frontend in this repo now talks directly to this API with `fetch()`.

Important: do not open `index.html` using `file://`.

Run the frontend over HTTP instead:

```bash
npx serve . -l 3000
```

or

```bash
python3 -m http.server 3000
```

Then open `http://localhost:3000`.

### Recommended minimal frontend migration

1. Add a small API helper:

```js
const API_BASE = "http://localhost:5001/api";

async function api(path, options = {}) {
  const token = window.__inMemoryToken;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}
```

2. On login, store `data.token`, `data.user`, and `data.company`
3. Replace local reads like `DB.getAll("expenses")` with `GET /api/expenses`
4. Replace writes like `DB.push("expenses", ...)` with `POST /api/expenses`
5. Use `FormData` for receipt uploads

### Expense upload example

```js
const formData = new FormData();
formData.append("amount", amount);
formData.append("currency", currency);
formData.append("category", category);
formData.append("description", description);
formData.append("date", date);
if (receiptFile) formData.append("receipt", receiptFile);

const token = window.__inMemoryToken;
const response = await fetch("http://localhost:5001/api/expenses", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`
  },
  body: formData
});
```

## Notes

- OCR is implemented as a clean placeholder service in `src/services/ocrService.js`
- Currency conversion uses the ExchangeRate API and caches results
- Redis is optional; the backend falls back to in-memory caching when Redis is not configured
- Email notifications are optional and activate automatically if SMTP settings are provided
