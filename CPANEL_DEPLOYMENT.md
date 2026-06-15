# cPanel Deployment

This project is configured for a cPanel Node.js app with MySQL.

## 1. Create MySQL Database

In cPanel, create a database and user, then assign the user to the database with all privileges.

Example:

```env
DB_HOST=localhost
DB_NAME=cpaneluser_marketplace
DB_USER=cpaneluser_marketplace
DB_PASSWORD=your_mysql_password
DB_PORT=3306
```

## 2. Upload Project

Upload the project files except:

```text
node_modules
.next
.next-build
.localdb
next-build.out.log
next-build.err.log
```

## 3. Install And Build

In the cPanel terminal or Node.js app screen:

```bash
npm ci
npm run db:install
npm run setup:admin -- admin@example.com "StrongAdminPassword" "Admin Name"
npm run build
npm run start
```

## 4. Node.js App Settings

Use these settings in cPanel Node.js app:

```text
Application startup file: server.cjs
Application mode: Production
Application root: the uploaded project folder
Application URL: your domain or subdomain
```

Required environment variables:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com
AUTH_SECRET=replace-with-a-long-random-secret-at-least-32-characters
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cpaneluser_marketplace
DB_USER=cpaneluser_marketplace
DB_PASSWORD=your_mysql_password
```

## 5. Important Notes

- Production build output uses `.next-build` because the local `.next` cache became permission-locked during earlier failed builds.
- `server.cjs` reads the same Next config, so `npm run start` and cPanel startup both use `.next-build`.
- Local dev can run without MySQL and uses `.localdb`; production requires MySQL env variables.
- The local dev helper `/api/auth/dev-login` is disabled in production.
