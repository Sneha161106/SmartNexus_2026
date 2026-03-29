# Expense Reimbursement App

## Run the backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend listens on `http://localhost:5001`.

## Run the frontend

Do not open `index.html` with `file://`.

Serve the project over HTTP from the repo root instead:

```bash
npx serve . -l 3000
```

or

```bash
python3 -m http.server 3000
```

Then open:

```text
http://localhost:3000
```

The frontend is configured to call:

```text
http://localhost:5001/api
```
