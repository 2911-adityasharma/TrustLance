# API Documentation — Reputation-Weighted Freelance Escrow

Base URL: `/api/v1`

Standard Response Format:
```json
// Success
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}

// Error
{
  "success": false,
  "message": "Error summary",
  "errors": ["Detailed message 1"]
}
```

---

## 1. Authentication

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Login user & set HTTP-only cookie | No |
| `POST` | `/auth/logout` | Clear authentication cookie | Yes |
| `GET` | `/auth/me` | Get current authenticated user profile | Yes |

---

## 2. Projects

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/projects` | Create a new project draft | Yes (Client) |
| `GET` | `/projects` | List projects for logged in user | Yes |
| `GET` | `/projects/:projectId` | Get project details | Yes (Participant) |
| `PATCH` | `/projects/:projectId` | Update project metadata | Yes (Client/Admin) |
| `POST` | `/projects/:projectId/invite` | Invite freelancer via email | Yes (Client) |
| `POST` | `/projects/:projectId/accept-invitation` | Accept project invitation | Yes (Freelancer) |
| `GET` | `/projects/:projectId/messages` | List paginated conversation history | Yes (Participant) |

---

## 3. Documents & Specifications

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/projects/:projectId/documents/generate` | Generate structured draft spec via Gemini | Yes |
| `POST` | `/projects/:projectId/documents` | Create manual document version | Yes |
| `GET` | `/projects/:projectId/documents` | List document versions | Yes |
| `GET` | `/projects/:projectId/documents/:version` | Get document details & signatures | Yes |
| `POST` | `/projects/:projectId/documents/:version/submit` | Submit document version for dual approval | Yes |
| `POST` | `/projects/:projectId/documents/:version/approve` | Approve document version (locks when both approve) | Yes |
| `POST` | `/projects/:projectId/documents/:version/reject` | Reject document version | Yes |

---

## 4. Milestones & Change Requests

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/projects/:projectId/milestones` | Create funded milestone | Yes |
| `GET` | `/projects/:projectId/milestones` | List project milestones | Yes |
| `POST` | `/milestones/:id/submit` | Submit deliverable for review | Yes (Freelancer) |
| `POST` | `/milestones/:id/approve` | Approve milestone deliverable | Yes (Client) |
| `POST` | `/milestones/:id/request-revision` | Request deliverable revision | Yes (Client) |
| `POST` | `/projects/:projectId/change-requests` | Propose change request | Yes |
| `PATCH` | `/change-requests/:id/respond` | Approve/Reject change request | Yes |

---

## 5. AI Dispute Chatbot & Conflict Resolution

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/ai/dispute-assistant/start` | Start dispute session & set deadline | Yes |
| `POST` | `/ai/dispute-assistant/:disputeId/message` | Post message to dispute chat | Yes |
| `POST` | `/disputes/:disputeId/complete-claim` | Complete initial claim submission | Yes |
| `POST` | `/disputes/:disputeId/respond` | Submit second-party response | Yes |
| `POST` | `/disputes/:disputeId/evidence` | Upload evidence (file / screenshot) | Yes |
| `POST` | `/disputes/:disputeId/analyze` | Run hybrid AI conflict analysis | Yes |
| `GET` | `/disputes/:disputeId` | Get dispute details | Yes |
| `GET` | `/disputes/:disputeId/messages` | Get dispute messages | Yes |
| `GET` | `/disputes/:disputeId/recommendation` | Get AI recommendation | Yes |
| `POST` | `/disputes/:disputeId/human-review` | Escalate to human arbitrator review | Yes |

---

## 6. Socket.IO Real-time Events

Connection URL: `http://localhost:5000` (authenticated via HTTP-only cookie or `auth.token`).

Events:
* `project:join` — Join room `project:{projectId}`.
* `project:leave` — Leave room `project:{projectId}`.
* `message:send` — Send message `{ projectId, clientMessageId, content, milestoneId, messageType }`.
* `message:new` — Broadcasted to project room upon database persistence.
* `message:ack` — Direct ACK emitted to sender upon success or duplicate deduplication.
* `message:error` — Emitted to sender on validation or permission failure.
