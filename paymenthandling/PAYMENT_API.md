# USDCEscrow Payment Backend API Documentation

This API handles smart contract escrow creation, on-chain funds release, and project status queries for Problem Statement 3 (Freelance Escrow).

- **Base URL**: `http://localhost:5000`
- **Content-Type**: `application/json`
- **CORS**: Enabled for all origins (`*`) for easy frontend development.

---

## Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/payment/create-escrow` | Locks funds on-chain using Admin Relayer Wallet |
| `POST` | `/api/payment/release` | Releases escrowed project funds to the freelancer |
| `GET` | `/api/payment/project/:id` | Fetches on-chain project struct details from smart contract |
| `POST` | `/api/pay-upi` | Checkout compatibility route for instant UPI escrow lock |
| `GET` | `/api/health` | Health check endpoint |

---

## Endpoint Details

### 1. Create Escrow Project
Locks funds in the `USDCEscrow` smart contract using the backend Admin Relayer wallet.

- **URL**: `POST /api/payment/create-escrow`
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "freelancerAddress": "0x3C44Cddb6a900fa2b585dd299e03d12FA4293BCF",
  "amountInUSDC": 60,
  "amountInINR": 5000
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "projectId": 0,
  "txHash": "0x33df0f83e30b73c4991e1bff3efc80c4f562e1a4c640681284b869c5ffc794e6",
  "freelancerAddress": "0x3C44Cddb6a900fa2b585dd299e03d12FA4293BCF",
  "amountInUSDC": 60,
  "amountInINR": 5000,
  "state": "Active"
}
```

#### Error Response (`400 / 500`)
```json
{
  "success": false,
  "error": "Invalid freelancer wallet address."
}
```

---

### 2. Release Escrow Funds
Executes `releaseFunds(projectId)` on-chain, transferring 100% of escrowed USDC to the freelancer and updating reputation scores.

- **URL**: `POST /api/payment/release`
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "projectId": 0
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "projectId": 0,
  "txHash": "0x8f10bc47a98293751a00f2832810cd04791823901b2a9e38d7281023719b380",
  "status": "Completed",
  "message": "Funds for Project #0 successfully released to freelancer on-chain."
}
```

---

### 3. Get Project On-Chain Status
Fetches current struct details directly from the `USDCEscrow` smart contract.

- **URL**: `GET /api/payment/project/:id`
- **Example**: `GET http://localhost:5000/api/payment/project/0`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "projectId": 0,
  "client": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "freelancer": "0x3C44Cddb6a900fa2b585dd299e03d12FA4293BCF",
  "amountUSDC": "60.0",
  "stateInt": 0,
  "state": "Active"
}
```

#### Project State Mapping Table
| `stateInt` | `state` String | Description |
| :--- | :--- | :--- |
| `0` | `Active` | Escrow funds locked on-chain |
| `1` | `Completed` | Funds released to freelancer |
| `2` | `Disputed` | Dispute raised, waiting for AI/Owner mediation |
| `3` | `Resolved` | Dispute resolved with split |

---

### 4. Health Check
- **URL**: `GET /api/health`

#### Success Response (`200 OK`)
```json
{
  "status": "ok",
  "service": "USDCEscrow Payment API",
  "port": 5000,
  "timestamp": "2026-08-08T15:48:00.000Z"
}
```
