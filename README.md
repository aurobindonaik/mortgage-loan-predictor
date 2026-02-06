# AI Credit Lens — Backend + React UI

This project contains:

- `backend/` — Spring Boot service that loads **two H2O MOJO models**:
    - approval (approved / not approved)
    - max borrow amount (regression)
- `frontend/` — React single‑page app (built with Vite) to submit inputs and display results.
- `docker-compose.yml` — builds & runs backend + frontend together.
- `models/` — place your MOJO files here:
    - `mo_approval_model.zip`
    - `mo_borrow_model.zip`
    - `credit_approval_model.zip`
    - `credit_borrow_model.zip`
    - `loan_approval_model.zip`
    - `loan_borrow_model.zip`
    - `current_approval_model.zip`

## Quickstart

1. Train H2O models (approval, borrow) for each product and export MOJOs with these names:
    - `mo_approval_model.zip`
    - `mo_borrow_model.zip`
    - `credit_approval_model.zip`
    - `credit_borrow_model.zip`
    - `loan_approval_model.zip`
    - `loan_borrow_model.zip`
    - `current_approval_model.zip`

2. Put them into `./models/`.

3. From repo root, run:
   ```bash
   docker-compose up --build
   ```

## Run Locally (Docker Compose)

Start the frontend + backend containers:
```bash
docker-compose up --build
```

Open:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`

## Build & Run Production Image

Build the combined image from the repo root:
```bash
docker build -t ai-credit-lens:prod .
```

Run it:
```bash
docker run --rm -p 8080:8080 ai-credit-lens:prod
```

Open:
- App + API: `http://localhost:8080`
