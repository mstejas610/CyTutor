# CyTutor Backend (Node.js) – AWS Deployment Setup

This guide explains how to run the CyTutor authentication + API backend in Node.js and deploy it to AWS. It is written for students; follow steps exactly.

---

## 1) Prerequisites
- Git (2.30+)
- Node.js 18 LTS and npm 9+ (or Yarn 1.22+)
- Docker 24+ (optional, for local DB) and Docker Compose
- An AWS account with access to: IAM, VPC, EC2 or Elastic Beanstalk or Lambda + API Gateway, RDS (PostgreSQL) or DynamoDB, Secrets Manager or SSM Parameter Store, CloudWatch Logs
- AWS CLI v2 configured: `aws configure` (Access key, Secret key, region, output)

---

## 2) Repository layout (after adding Node backend)
```
CyTutor/
├─ api/                      # Node.js backend
│  ├─ src/
│  │  ├─ app.ts|js           # Express app (or Fastify)
│  │  ├─ server.ts|js        # HTTP server bootstrap
│  │  ├─ routes/
│  │  │  ├─ auth.routes.ts|js
│  │  │  └─ users.routes.ts|js
│  │  ├─ controllers/
│  │  │  ├─ auth.controller.ts|js
│  │  │  └─ users.controller.ts|js
│  │  ├─ services/
│  │  │  ├─ auth.service.ts|js
│  │  │  └─ user.service.ts|js
│  │  ├─ middleware/
│  │  │  └─ auth.middleware.ts|js   # JWT verification
│  │  ├─ db/
│  │  │  ├─ prisma/ or knex/        # Pick one ORM
│  │  │  └─ index.ts|js
│  │  ├─ utils/
│  │  │  ├─ env.ts|js
│  │  │  └─ logger.ts|js
│  │  └─ types.d.ts (if TS)
│  ├─ package.json
│  ├─ tsconfig.json (if TS)
│  ├─ .env.example
│  └─ Dockerfile
├─ UI/                       # existing frontend
├─ Challenges/               # labs
├─ README.md
└─ SETUP.md (this file)
```

---

## 3) Environment variables (backend/.env)
Copy `.env.example` to `.env` and set values:
- NODE_ENV=development|production
- PORT=8080
- DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME  (RDS) or sqlite/dev URL
- JWT_SECRET=superlongrandomvalue
- ACCESS_TOKEN_TTL=15m
- REFRESH_TOKEN_TTL=7d
- CORS_ORIGIN=https://your-frontend-domain (or http://localhost:5173)
- LOG_LEVEL=info
- AWS_REGION=ap-south-1 (or your region)

Optional (email/OTP):
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

Store secrets in AWS Secrets Manager or SSM in prod. Do not commit .env.

---

## 4) Authentication and API design (Node.js)
- Auth: email+password with bcrypt, JWT access/refresh tokens, rotation and revocation
- Password hashing: bcrypt(12-14)
- Login flow: POST /api/auth/login returns access and refresh tokens (httpOnly cookie recommended)
- Refresh: POST /api/auth/refresh exchanges refresh token for new access token
- Logout: POST /api/auth/logout invalidates refresh token
- Register: POST /api/auth/register with email verification (optional)
- Protected routes use middleware that verifies JWT (Authorization: Bearer <token>)

Example minimal Express skeleton (TypeScript shown, JS similar):
```
// api/src/app.ts
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

export default app;

// api/src/server.ts
import http from 'http';
import app from './app';
const port = process.env.PORT || 8080;
http.createServer(app).listen(port, () => {
  console.log(`API listening on ${port}`);
});
```

---

## 5) Local development
- Install deps: `cd api && npm i`
- Run dev: `npm run dev` (nodemon/ts-node or vite-node)
- Run lint/tests: `npm run lint && npm test`
- Start Postgres locally:
  - Option A: Docker Compose
    - docker-compose.yml (example):
```
version: '3.9'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: cytutor
      POSTGRES_PASSWORD: cytutor
      POSTGRES_DB: cytutor
    ports: ["5432:5432"]
    volumes:
      - dbdata:/var/lib/postgresql/data
volumes:
  dbdata:
```
  - Option B: Use SQLite in dev (change DATABASE_URL)

- Run DB migrations (Prisma example): `npx prisma migrate dev`

---

## 6) AWS deployment options (choose ONE)
You can deploy the Node backend via any of these managed paths:

A) Elastic Beanstalk (easiest for full Node app)
- Create app and environment (Web server, Node.js 18 platform)
- Configure environment variables in EB console or via .ebextensions
- Attach RDS (Postgres) in same VPC/security group or use existing RDS
- Deploy via ZIP upload or `eb cli`

B) EC2 + PM2 + Nginx (more control)
- Launch EC2 (Amazon Linux 2023), open inbound 80/443, 22
- Install Node 18: `nvm install --lts`
- Clone repo, set up `.env` (use SSM Parameter Store via `aws ssm get-parameter` on boot)
- Install PM2: `npm i -g pm2` and run `pm2 start dist/server.js --name cytutor-api`
- Install Nginx as reverse proxy with SSL (ACM+ALB recommended or Certbot)

C) Lambda + API Gateway (serverless)
- Use Express wrapped by `@vendia/serverless-express` or refactor to Lambda handlers
- Create API Gateway HTTP API, integrate with Lambda
- Store env in Lambda configuration or SSM/Secrets Manager
- Good for low traffic; ensure cold-start acceptable

Pick the option your instructor recommends. Steps for A and B are below.

---

## 7) Elastic Beanstalk – step-by-step
1. Build the app
   - Ensure `api/package.json` has scripts:
```
{
  "scripts": {
    "build": "tsc",            // or noop for JS
    "start": "node dist/server.js"
  }
}
```
   - From `api/`: `npm ci && npm run build`

2. Create deployment bundle (from repo root):
```
zip -r cytutor-api.zip api/ -x "**/node_modules/**" "**/.git/**"
```

3. Elastic Beanstalk setup
- Open AWS Console → Elastic Beanstalk → Create application
- Platform: Node.js 18, Architecture: x86_64
- Upload `cytutor-api.zip`
- After environment is ready, set Configuration → Software → Environment properties:
  - NODE_ENV=production
  - PORT=8080
  - DATABASE_URL=...
  - JWT_SECRET=...
  - CORS_ORIGIN=https://your-frontend-domain
  - LOG_LEVEL=info

4. Database (RDS)
- Create RDS PostgreSQL (free tier where possible)
- Security groups: allow EB instances to connect on 5432
- Copy the endpoint into DATABASE_URL
- Run migrations on EB instance (via EB SSH) or use CI to run `npx prisma migrate deploy`

5. Logs and health
- Check EB logs and health dashboard
- Verify `/health` endpoint

---

## 8) EC2 + PM2 – step-by-step
1. Launch EC2 in a public subnet; create security group allowing 80/443 and 22
2. SSH in and install Node, Git, Nginx, and PM2
```
sudo dnf update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
sudo dnf install -y nodejs git nginx
sudo npm i -g pm2
```
3. Pull code and build
```
cd /var/www
sudo git clone https://github.com/mstejas610/CyTutor.git
cd CyTutor/api
npm ci
npm run build
```
4. Configure environment
- Create `/var/www/CyTutor/api/.env` with values (or fetch from SSM)
5. Start service with PM2
```
pm2 start dist/server.js --name cytutor-api
pm2 save
pm2 startup systemd   # follow the printed command to enable on boot
```
6. Nginx reverse proxy (port 80 → 8080)
```
sudo tee /etc/nginx/conf.d/cytutor.conf >/dev/null <<'NGX'
server {
  listen 80;
  server_name _;
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
NGX
sudo nginx -t && sudo systemctl restart nginx
```
7. HTTPS
- Option A: Put an Application Load Balancer (ALB) in front with ACM certificate
- Option B: Use Certbot on EC2 and update Nginx for 443

---

## 9) Lambda + API Gateway (outline)
- Install: `npm i @vendia/serverless-express` and create `lambda.ts`:
```
import serverlessExpress from '@vendia/serverless-express';
import app from './app';
export const handler = serverlessExpress({ app });
```
- Build and package with AWS SAM or Serverless Framework
- Configure routes in API Gateway and deploy

---

## 10) CI/CD (optional)
- GitHub Actions example (api/.github/workflows/deploy-eb.yml):
```
name: Deploy EB
on:
  push:
    branches: [ node_auth ]
    paths: [ 'api/**' ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: cd api && npm ci && npm run build
      - name: Zip bundle
        run: zip -r cytutor-api.zip api -x "**/node_modules/**" "**/.git/**"
      - name: Deploy to EB
        uses: einaregilsson/beanstalk-deploy@v22
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          region: ap-south-1
          application_name: CyTutor
          environment_name: cytutor-env
          version_label: v-${{ github.sha }}
          deployment_package: cytutor-api.zip
```
- Store secrets in GitHub repo settings → Secrets and variables → Actions

---

## 11) Connect UI to backend
- For local: set UI to call `http://localhost:8080`
- For AWS: set UI API base URL to EB/EC2/ALB or API Gateway domain
- Enable CORS origins accordingly

---

## 12) Troubleshooting
- 502/504 on EB: check logs; ensure PORT matches environment; health check path `/health`
- RDS connection fails: verify SG rules, correct username/password, and that DB is publicly accessible only if necessary (prefer private)
- CORS errors: ensure `CORS_ORIGIN` matches exact protocol+host
- JWT invalid: verify server time is correct and secrets identical across instances

---

## 13) Appendix – Example package.json (api)
```
{
  "name": "cytutor-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint .",
    "test": "vitest"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.11.30",
    "eslint": "^9.10.0",
    "nodemon": "^3.1.0",
    "typescript": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

---

Notes
- Keep production secrets in Secrets Manager/SSM; never commit
- Prefer RDS in private subnets; access via NAT/EC2/EB instances
- Use CloudWatch for logs and alarms
