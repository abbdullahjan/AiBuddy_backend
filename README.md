# Reusable Modular Authentication Backend

A production-ready, modular authentication REST API built with Node.js, Express, MongoDB Atlas, Mongoose, bcryptjs, and JSON Web Tokens (JWT). Designed for seamless integration with the reusable Flutter authentication module (`RestAuthService`) and web applications.

---

## 1. Project Structure

```text
Reusable-Backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Mongoose connection lifecycle & status checks
│   │   └── env.js               # Strict environment validation & configuration loading
│   ├── models/
│   │   └── User.js              # Mongoose user schema, bcrypt hashing, normalization & safe serialization
│   ├── routes/
│   │   ├── auth.routes.js       # Route definitions for authentication & current user endpoints
│   │   └── health.routes.js     # Health probe endpoint routes
│   ├── controllers/
│   │   ├── auth.controller.js   # Request parsing & HTTP response formatting for auth
│   │   └── health.controller.js # Live database health probe handler
│   ├── services/
│   │   ├── auth.service.js      # Business logic: signup, login, username lookup, user retrieval
│   │   └── password-reset.service.js # Safe password-reset workflow with enumeration protection
│   ├── middleware/
│   │   ├── auth.middleware.js   # Bearer JWT verification & database user existence verification
│   │   ├── error.middleware.js  # Centralized error handler & 404 router
│   │   └── rate-limit.middleware.js # Express rate-limiting for auth endpoints
│   ├── validators/
│   │   └── auth.validators.js   # Request body & query parameter schema validation
│   ├── utils/
│   │   ├── api-error.js         # Standard operational HTTP ApiError class
│   │   └── jwt.js               # JWT signing & verification helpers
│   ├── app.js                   # Express application setup (Helmet, CORS, parsers, routes)
│   └── server.js                # Server entry point with graceful shutdown handling
├── tests/
│   ├── auth.test.js             # 25 automated integration tests for authentication
│   ├── health.test.js           # Live & offline database health check tests
│   └── setup.js                 # Isolated MongoDB Memory Server lifecycle & teardown hooks
├── .env.example                 # Environment variables blueprint with placeholders
├── .gitignore                   # Excludes .env, node_modules, and coverage
├── jest.config.js               # Jest runner configuration
├── package.json                 # Project dependencies & scripts
└── README.md                    # Backend documentation and Flutter integration guide
```

---

## 2. Module Responsibilities

| Module | Location | Primary Responsibilities |
| :--- | :--- | :--- |
| **Config** | `src/config/` | Validates environment variables at startup (fails fast if mandatory variables like `MONGODB_URI` or `JWT_SECRET` are insecure in production). Manages Mongoose connection state and lifecycle. |
| **Models** | `src/models/` | Defines the Mongoose `User` schema. Normalizes emails and usernames. Enforces unique indexes (including case-insensitive usernames via partial indexes). Hashes passwords with bcrypt and excludes hashes from JSON output. |
| **Validators** | `src/validators/` | Enforces request constraints before controller invocation: email format, minimum password length (>= 6), username format and length (3-30 chars), and phone number format. |
| **Services** | `src/services/` | Pure business logic isolated from HTTP transport: password comparison, token generation, conflict detection, and password-reset handling. |
| **Controllers** | `src/controllers/` | Translates HTTP requests to service calls and returns JSON responses conforming to client contracts. |
| **Middleware** | `src/middleware/` | Security layer: Bearer token validation with live DB user checks, IP rate limiting, and centralized error handling (translating Mongoose, JWT, and operational errors into standard JSON errors). |
| **Utils** | `src/utils/` | Reusable utilities: `ApiError` and JWT signing/verification with `jsonwebtoken`. |
| **App & Server** | `src/app.js` & `src/server.js` | `app.js` defines Express middleware and mounts routes for Supertest and production without starting a listener. `server.js` connects to MongoDB Atlas and listens on the configured port with graceful SIGINT/SIGTERM teardown. |

---

## 3. MongoDB Atlas Configuration

1. **Create an Atlas Cluster:**
   - Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a free shared cluster (M0) or dedicated cluster.

2. **Configure Database User:**
   - Navigate to **Security** -> **Database Access**.
   - Click **Add New Database User**.
   - Choose **Password** authentication and set secure credentials.
   - Assign the user the **Read and write to any database** role.

3. **Configure IP Access List:**
   - Navigate to **Security** -> **Network Access**.
   - Click **Add IP Address**.
   - Add your current IP address (or `0.0.0.0/0` for cloud deployments).

4. **Retrieve Connection String:**
   - Navigate to **Deployment** -> **Database**.
   - Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string format:
     ```text
     mongodb+srv://<username>:<password>@<cluster-address>.mongodb.net/<dbname>?retryWrites=true&w=majority
     ```
   - Store this URI in your local `.env` file as `MONGODB_URI`.

---

## 4. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```dotenv
NODE_ENV=development
PORT=3000
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long_12345
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=*
```

> **Security Note:** Never commit `.env` to version control. `.env` is explicitly ignored in `.gitignore`.

---

## 5. Installation and Execution

### Install Dependencies
```powershell
npm install
```

### Run in Development Mode (Live Watch)
```powershell
npm run dev
```

### Run in Production Mode
```powershell
npm start
```

---

## 6. Automated Testing

Automated tests run against an isolated in-memory MongoDB server (`mongodb-memory-server`), completely decoupled from your production database.

### Run All Tests
```powershell
npm test
```

### Run Health Tests Only
```powershell
npx jest --runInBand --runTestsByPath tests/health.test.js --verbose
```

### Run Auth Tests Only
```powershell
npx jest --runInBand --runTestsByPath tests/auth.test.js --verbose
```

### Test Coverage Summary (27/27 Tests Passing)
- **POST /auth/signup**: Full profile signup, minimal profile signup, omitted optional username handling, duplicate email (409), case-insensitive email collision (409), case-insensitive username collision (409), invalid email format (400), weak password <6 chars (400), invalid username format (400).
- **POST /auth/login**: Valid login, case-insensitive email login, invalid password (401), non-existent user (401 generic).
- **GET /auth/username-available**: Available username check, taken username check, case-insensitive check, empty query string handling.
- **POST /auth/forgot-password**: Safe generic response (200), enumeration protection for registered vs unregistered emails, invalid email validation (400).
- **GET /auth/me**: Authenticated user retrieval, missing token (401), invalid token (401), expired token (401), deleted database user (401).
- **GET /health**: Connected database check (200), disconnected database check (503).

---

## 7. API Specification

### 1. Health Probe
- **Endpoint:** `GET /health`
- **Response (200 OK):**
  ```json
  {
    "status": "OK",
    "database": "connected",
    "timestamp": "2026-10-16T14:46:16.792Z"
  }
  ```
- **Response (503 Service Unavailable):**
  ```json
  {
    "status": "ERROR",
    "database": "disconnected",
    "timestamp": "2026-10-16T14:46:16.792Z"
  }
  ```

### 2. User Registration
- **Endpoint:** `POST /auth/signup`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "fullName": "Jane Doe",
    "userName": "janedoe",
    "phoneNumber": "+1234567890",
    "termsAccepted": true
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "670f...",
      "email": "user@example.com",
      "displayName": "Jane Doe",
      "fullName": "Jane Doe",
      "userName": "janedoe",
      "phoneNumber": "+1234567890",
      "termsAccepted": true,
      "emailVerified": false,
      "photoUrl": null,
      "createdAt": "2026-10-16T14:46:16.792Z"
    }
  }
  ```
- **Conflict Response (409 Conflict):**
  ```json
  {
    "error": "This email is already in use.",
    "status": 409
  }
  ```

### 3. User Login
- **Endpoint:** `POST /auth/login`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "670f...",
      "email": "user@example.com",
      "displayName": "Jane Doe",
      "emailVerified": false,
      "photoUrl": null
    }
  }
  ```
- **Failure Response (401 Unauthorized):**
  ```json
  {
    "error": "Invalid credentials.",
    "status": 401
  }
  ```

### 4. Username Availability
- **Endpoint:** `GET /auth/username-available?userName=janedoe`
- **Success Response (200 OK):**
  ```json
  {
    "available": true
  }
  ```

### 5. Forgot Password
- **Endpoint:** `POST /auth/forgot-password`
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "If an account exists with this email address, password reset instructions will be sent."
  }
  ```

### 6. Authenticated Current User
- **Endpoint:** `GET /auth/me`
- **Headers:** `Authorization: Bearer <jwt-token>`
- **Success Response (200 OK):**
  ```json
  {
    "user": {
      "id": "670f...",
      "email": "user@example.com",
      "displayName": "Jane Doe",
      "fullName": "Jane Doe",
      "userName": "janedoe",
      "phoneNumber": "+1234567890",
      "emailVerified": false,
      "photoUrl": null,
      "createdAt": "2026-10-16T14:46:16.792Z"
    }
  }
  ```

---

## 8. Flutter REST Authentication Integration

This backend is designed to integrate 1:1 with the Flutter reusable module:
`E:\Flutter_Projects\NESCON\Project_Additional_Comp\Flutter-Reusable-Components`

### Configuring `RestAuthService` in Flutter

```dart
import 'package:flutter/foundation.dart';
import 'package:reusable_flutter_components/services/flutter_REST_auth/rest_auth_service.dart';
import 'package:reusable_flutter_components/services/flutter_REST_auth/rest_endpoints.dart';

void setupAuthentication() {
  final Uri backendUrl = kReleaseMode
      ? Uri.parse('https://your-production-domain.com')
      : Uri.parse('http://10.0.2.2:3000'); // 10.0.2.2 for Android Emulator, localhost for iOS/Web

  final RestAuthService authService = RestAuthService(
    baseUrl: backendUrl,
    allowInsecureHttp: !kReleaseMode, // Allow HTTP during local development
    endpoints: const RestEndpoints(
      loginPath: '/auth/login',
      signupPath: '/auth/signup',
      forgotPasswordPath: '/auth/forgot-password',
      usernameAvailabilityPath: '/auth/username-available',
    ),
  );
}
```

### Contract Alignment Details
1. **Response Shapes:** The backend user object includes `id`, `email`, `displayName`, `photoUrl`, and `emailVerified`, matching `JsonRestAuthAdapter.parseSession`.
2. **Status Codes:**
   - `409 Conflict` maps directly to Flutter's `AuthServiceMessages.emailAlreadyInUse`.
   - `401 Unauthorized` maps to Flutter's `AuthServiceMessages.invalidCredentials`.
   - `5xx` maps to Flutter's `AuthServiceMessages.somethingWentWrong`.
3. **Username Check:** Returned `{ "available": boolean }` matches `JsonRestAuthAdapter.parseUsernameAvailability`.
4. **Local Sign-Out:** The Flutter client clears local JWT storage cleanly without requiring a network logout call.

---

## 9. Security Implementation

- **Password Hashing:** Implemented with `bcryptjs` (salt rounds: 10). Hashes are never returned in responses and excluded from Mongoose queries by default (`select: false`).
- **JWT Protection:** Signed using HMAC SHA-256 with an environment-supplied secret and expiration.
- **Header Protection:** `helmet()` configured for HTTP security headers.
- **CORS Configuration:** Explicit allowed origins configuration.
- **Payload Size Limiting:** Express JSON body parser is restricted to 10KB to mitigate DoS payload attacks.
- **Rate Limiting:** IP rate limiter prevents brute-force attacks on `/auth/*` endpoints (100 requests per 15 minutes), automatically disabled during test runs.
- **Account Enumeration Protection:** Forgot-password endpoint returns an identical generic response regardless of whether an account exists.
- **Live User Verification:** `/auth/me` verifies that the user still exists in MongoDB rather than blindly trusting decoded JWT claims.

---

## 10. Known Limitations & Next Steps

1. **Email Provider Configuration:**
   Currently, `/auth/forgot-password` returns a safe generic response without dispatching an email. When deploying to production, configure an email provider (such as SendGrid, AWS SES, or Resend) to generate cryptographic reset tokens with expiration and send reset links.
2. **Token Revocation / Refresh Tokens:**
   The current architecture uses stateless Bearer JWTs with a 7-day expiration. For enterprise multi-session management, implement refresh token rotation with a database-backed token whitelist or Redis blacklist.
