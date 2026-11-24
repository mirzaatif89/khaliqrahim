# HostNexo cPanel deployment

Target domain: `ambitious-olive-possum.37-27-52-96.cpanel.site`.
Use the domain root, without `/cgi-sys/defaultwebpage.cgi`.

## 1. Create the MySQL database

In cPanel → MySQL Databases / Manage My Databases, create a database and a user,
then add that user to the database with **ALL PRIVILEGES**. Copy the full names,
including the cPanel account prefix. Do not use the local `root` account.
The database must support the project's MySQL 8.0.16+ schema, JSON functions,
expression defaults and stored procedures. Ask HostNexo to confirm compatibility
if their server uses MariaDB instead of MySQL. Routine creation must be allowed.

## 2. Upload the prepared application

Upload `khaliqrahim-cpanel.zip` through File Manager and extract it into a folder
such as `/home/YOUR_CPANEL_USER/khaliqrahim`, outside `public_html`.
The extracted application root must contain `app.cjs`, `package.json`, `scripts/`,
`.output-hosting/`, `.env.example`, and the schema source under `drizzle/`.
Enable **Show Hidden Files** in File Manager if necessary.
The archive already contains the production build and all bundled images;
there is no need to compile the frontend on the shared hosting server.

## 3. Set environment values

Copy the included `.env.example` to `.env` in the application root. Fill in the
cPanel database name, username and password, and choose an admin password.
Use the exact origin in `APP_URL`: initially the supplied HTTP domain, or HTTPS
when its SSL certificate is active. Never include the default placeholder path.
Do not set `PORT`; cPanel Passenger manages the listener. Environment values
configured in the Node.js app panel take precedence over `.env`.
Keep this app directory outside the public document root so `.env` is private.

## 4. Register the Node.js app

In **Setup Node.js App → Create Application**:

| Setting | Value |
| --- | --- |
| Node.js version | 22.12+ or 24 (not 16/18) |
| Application mode | Production |
| Application root | `khaliqrahim` (the folder you extracted into) |
| Application URL | Select the temporary domain; leave the subpath empty |
| Application startup file | `app.cjs` |

Save, then use **Run NPM Install** to install the small runtime dependency set.
This package uses `node app.cjs` / `npm start`, not the repository's local Vite
development server. If your panel is Application Manager rather than Node.js
Selector, ask HostNexo to set the startup file to `app.cjs` for this app.

## 5. Initialize tables and seed content

If cPanel has Terminal, copy and run the virtual-environment activation command
shown by Setup Node.js App, then from the application root run:

```sh
npm run db:setup
```

Alternatively, if the Node.js panel provides **Run JS Script**, run
`scripts/setup-hosting-db.mjs`. This step uses the existing database; it does not
create/drop databases. It creates missing tables, foreign keys, and the versioned
stored procedure, and seeds missing catalog and content rows. Existing edits are
preserved. If routine privileges are denied, ask HostNexo to enable CREATE ROUTINE
and EXECUTE for your database user. Do not skip this step.

Restart the app in cPanel after initialization. Activate SSL/AutoSSL for the
temporary domain if available, update `APP_URL` to HTTPS, and restart before using
admin credentials publicly.

## 6. Verify the live app

Open the domain root. Verify Home, Shop, About, images and mobile navigation.
Use **Login** in the navbar to sign in and check the admin dashboard. Saving orders,
appointments, inquiries, reviews and uploads must use the hosted database.
Local Workbench's database is on your PC and does not automatically transfer.
The archive initializes the project's seeded catalog/content; if you have edited
local content or added products, migrate those records and `.local-media/` too.

Uploaded images are kept in `.local-media/` under the app root. Keep that folder
when updating files and back it up with the database. Admin sessions currently
live in process memory, expire after 8 hours, and reset on restart; use a single
Passenger application process to avoid inconsistent sessions across workers.

## Troubleshooting

- **Still shows the cPanel default page:** confirm the application's URL is bound
  to the temporary domain root and ask HostNexo to confirm the domain's document
  root / Passenger mapping. The `/cgi-sys/defaultwebpage.cgi` URL is a placeholder.
- **503:** inspect the app's stderr / Passenger log. Check Node version, startup
  file, npm installation, `.env`, and whether `.output-hosting/server/index.mjs`
  was extracted. Restart after changing configuration.
- **Database error:** use full prefixed database/user names and complete DB setup.
- **Invalid origin on login:** `APP_URL` must match the browser's protocol/domain.
- **Update code:** rebuild with `npm run build:hosting` on the development PC,
  prepare a fresh archive, replace build/code files, keep the hosting `.env` and
  `.local-media/`, and restart. Keep this local server's `.env` separate.

References: [cPanel Node.js applications](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/),
[CloudLinux Node.js Selector](https://docs.cloudlinux.com/cloudlinuxos/cloudlinux_os_components/#node-js-selector).
