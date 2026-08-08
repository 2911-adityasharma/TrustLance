# Reputation-Weighted Freelance Escrow — Anti-Ghosting System Backend

A production-grade Node.js backend for an Anti-Ghosting Freelance Escrow Platform. Features dual-approval specification versioning, deterministic fact checking, AI conflict resolution powered by Google Gemini (`@google/genai`), Socket.IO real-time client–freelancer chat, automated anti-ghosting response deadline tracking, and secure HTTP-only JWT authentication.

---

## Technical Architecture & Highlights

* **Framework & Server**: Node.js (ES Modules) with Express.js & Socket.IO.
* **ORM & Database**: Sequelize ORM with MySQL database, complete CLI migrations, indexes, and seeders.
* **AI Engine**: Official Google GenAI SDK (`@google/genai`) using Gemini models with Joi output schema validation. Graceful 503 fallback when missing API key.
* **Security**: Helmet security headers, CORS, HTTP-only JWT cookies, bcrypt password hashing, express-rate-limit, Multer MIME whitelist & file size limits, input sanitization via Joi.
* **Real-time Messaging**: Socket.IO project rooms in single file `src/socket.js`, message persistence in Sequelize, duplicate message deduplication via composite database unique index `(senderId, clientMessageId)`.
* **Dispute Resolution & Anti-Ghosting Engine**: Hybrid conflict resolution combining deterministic rule evaluations (milestone funding state, delivery dates, approved change requests, response delays) with Gemini AI reasoning. Background cron job (`node-cron`) automatically detects expired response deadlines and handles ghosting.

---

## Directory Structure

```text
reputation-weighted-freelance-escrow-backend/
├── package.json
├── .env.example
├── .gitignore
├── .sequelizerc
├── README.md
├── API_DOCUMENTATION.md
├── src/
│   ├── app.js
│   ├── server.js
│   ├── socket.js
│   ├── config/
│   │   ├── database.js
│   │   ├── env.js
│   │   └── logger.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── validators/
│   ├── models/
│   ├── migrations/
│   ├── seeders/
│   ├── services/
│   ├── prompts/
│   ├── jobs/
│   └── utils/
└── tests/
```

---

## Setup & Installation Instructions

### 1. Install Dependencies

Ensure Node.js v18+ is installed.

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` to configure your MySQL connection and Gemini API key:

```ini
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_NAME=freelance_escrow
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
COOKIE_SECURE=false

GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

BLOCKCHAIN_RPC_URL=
ESCROW_CONTRACT_ADDRESS=
```

> **Note**: If `GEMINI_API_KEY` is not provided, the server starts normally, but AI endpoints will return `503 AI service is not configured`.

### 3. Configure MySQL & Run Migrations

1. Ensure MySQL is running on your machine.
2. Run database creation, migrations, and demo seeders:

```bash
npm run db:create
npm run db:migrate
npm run db:seed
```

### Demo Accounts

The seed command creates frontend-ready projects, milestones, document approvals,
messages, a dispute recommendation, and notifications. All demo accounts use the
password `Password123!`:

| Role | Email |
| :--- | :--- |
| Client | `client@example.com` |
| Freelancer | `freelancer@example.com` |
| Arbitrator | `arbitrator@example.com` |
| Admin | `admin@example.com` |

### 4. Start Server

For development mode (with auto-reload):

```bash
npm run dev
```

For production mode:

```bash
npm start
```

The API will be available at `http://localhost:5000/api/v1`.

### 5. Running Automated Tests

Execute the Jest test suite:

```bash
npm test
```

---

## Main User Roles

* `CLIENT`: Project owner who creates projects, invites freelancers, approves milestone deliverables, and initiates/responds to disputes.
* `FREELANCER`: Receives invitations, submits milestone deliverables, proposes change requests, and responds to dispute chats.
* `ARBITRATOR`: Third-party human reviewer for dispute resolution escalation.
* `ADMIN`: System administrator with full access.

---

## License

MIT License
