# Mortgage 3‑MOJO Backend + React UI

This project contains:

- `backend/` — Spring Boot service that loads **two H2O MOJO models**:
    - approval (approved / not approved)
    - max borrow amount (regression)
- `frontend/` — React single‑page app (built with Vite) to submit customer data and display results.
- `docker-compose.yml` — builds & runs backend + frontend together.
- `models/` — place your 2 MOJO files here:
    - `approval_model.zip`
    - `borrow_model.zip`

## Quickstart

1. Train 2 H2O models (approval, borrow) on your CSV and export MOJOs with these names:
    - `approval_model.zip`
    - `borrow_model.zip`

2. Put them into `./models/`.

3. From repo root, run:
   ```bash
   docker-compose up --build
