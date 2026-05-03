# Creating an Admin User

There are two ways to create an admin user depending on whether you're running the project locally or via Docker.

---

## Option 1 — Local (npm)

Make sure your `.env` file is set up, then run:

```bash
node scripts/create-admin.js
```

Follow the prompts:

```
── Bharat Geo API Admin User Setup ──────────────────

Email:     admin@example.com
Full name: Jane Smith
Company (optional, press Enter to skip): Acme Inc
Password:  yourpassword
```

The script will create a new admin user, or upgrade an existing user to `ADMIN + ACTIVE` if the email already exists.

---

## Option 2 — Docker (containers running)

Run the script inside the API container:

```bash
docker exec -it bharatgeo_api node scripts/create-admin.js
```

Same prompts as above. The container must be running (`docker-compose up -d`).

---

## After Creation

Log in at:

| App | URL |
|-----|-----|
| Admin dashboard | http://localhost/admin |
| Client portal | http://localhost/client |

Use the email and password you entered above. Admin users can log into both apps.

---

## Notes

- Password must be at least 8 characters.
- If you forget your admin password, run the script again with the same email — it will reset the password and re-apply `ADMIN + ACTIVE` status.
- Client portal users who sign up are created with `PENDING` status. Approve them from the admin dashboard under **Users**.
