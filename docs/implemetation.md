# IAM Service - Implementation Specification

## 1. Purpose

This document defines the implementation details of the IAM (Identity and Access Management) Service.

The service is responsible for:

- Authentication
- Authorization
- User Management
- Role Management
- Permission Management
- Session Management using Refresh Tokens

---

# 2. Supported Clients

## Supported

- Web Applications (React, Angular, Vue)

## Not Supported In V1

- Mobile Applications
- Desktop Applications
- Machine-to-Machine Authentication
- Third-Party API Consumers

---

# 3. Authentication Strategy

## Access Token

Returned in response body.

Characteristics:

- JWT Token
- RS256 Signed
- 15 Minutes Expiry
- Stored in frontend memory

---

## Refresh Token

Returned as HttpOnly Cookie.

Characteristics:

- HttpOnly
- Secure
- SameSite=Strict
- Path=/auth/refresh
- 30 Days Expiry
- Rotated on every refresh

Refresh token is never accessible from JavaScript.

Refresh token is never returned in API response payloads.

---

# 4. Authentication Flow

## Login Flow

Client
↓
POST /auth/login
↓
Validate Credentials
↓
Generate Access Token
↓
Generate Refresh Token
↓
Store Refresh Token Hash
↓
Return Access Token
↓
Set Refresh Token Cookie

---

## Refresh Flow

Client
↓
POST /auth/refresh
↓
Browser Sends Refresh Cookie
↓
Validate Refresh Token
↓
Validate Database Record
↓
Load Current Roles
↓
Load Current Permissions
↓
Generate New Access Token
↓
Generate New Refresh Token
↓
Rotate Refresh Token
↓
Return Access Token
↓
Set New Refresh Token Cookie

---

## Logout Flow

Client
↓
POST /auth/logout
↓
Browser Sends Refresh Cookie
↓
Revoke Refresh Token
↓
Clear Cookie

---

# 5. Authorization Flow

Request
↓
JwtAuthGuard
↓
PermissionGuard
↓
Controller
↓
Service

---

## JwtAuthGuard Responsibilities

- Extract JWT
- Verify Signature
- Verify Expiry
- Decode Claims
- Attach User Context To Request

Example:

```ts
request.user = {
  userId: "123",
  roles: ["ADMIN"],
  permissions: ["user.read", "user.create"],
};
```

---

## PermissionGuard Responsibilities

- Read Required Permission Metadata
- Verify User Authorization

Example:

```ts
@Permissions('user.read')
@Get(':id')
findById() {}
```

Validation:

```ts
request.user.permissions.includes("user.read");
```

---

# 6. JWT Design

## Access Token

Algorithm:

```text
RS256
```

Expiry:

```text
15 Minutes
```

Payload:

```json
{
  "sub": "123",
  "roles": ["ADMIN"],
  "permissions": ["user.read", "user.create", "user.update", "user.delete"]
}
```

Access Token Must Not Contain:

- Password Hash
- Refresh Token
- Personal Information
- Internal Database Metadata

---

# 7. Refresh Token Design

Format:

```text
Cryptographically Secure Random String
```

Expiry:

```text
30 Days
```

Storage:

```text
Hashed Before Persistence
```

Rotation:

```text
Enabled
```

Cookie Configuration:

```text
HttpOnly = true
Secure = true
SameSite = Strict
Path = /auth/refresh
```

---

# 8. MongoDB Collections

## users

Purpose:

Stores user accounts.

Schema:

```json
{
  "_id": "ObjectId",
  "email": "user@test.com",
  "passwordHash": "hashed-password",
  "firstName": "John",
  "lastName": "Doe",
  "status": "ACTIVE",
  "roleIds": ["roleId"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Indexes:

```text
email (unique)
```

---

## roles

Purpose:

Stores role definitions.

Schema:

```json
{
  "_id": "ObjectId",
  "name": "ADMIN",
  "description": "Administrator",
  "permissionIds": ["permissionId"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Indexes:

```text
name (unique)
```

---

## permissions

Purpose:

Stores permission definitions.

Schema:

```json
{
  "_id": "ObjectId",
  "name": "user.read",
  "description": "Read User"
}
```

Indexes:

```text
name (unique)
```

---

## refresh_tokens

Purpose:

Stores active refresh tokens.

Schema:

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "tokenHash": "hashed-token",
  "expiresAt": "Date",
  "revoked": false,
  "createdAt": "Date"
}
```

Indexes:

```text
userId
expiresAt
```

---

# 9. Auth Module

## Responsibilities

- Login
- Logout
- Refresh Token Rotation
- JWT Generation
- JWT Validation
- Password Verification

---

## Endpoints

### POST /auth/login

Request:

```json
{
  "email": "admin@test.com",
  "password": "Password@123"
}
```

Flow:

1. Validate Request
2. Find User
3. Verify Status
4. Verify Password
5. Resolve Roles
6. Resolve Permissions
7. Generate Access Token
8. Generate Refresh Token
9. Store Refresh Token Hash
10. Return Access Token
11. Set Refresh Token Cookie

Response:

```json
{
  "accessToken": "<jwt>"
}
```

---

### POST /auth/refresh

Request:

No Request Body

Browser Automatically Sends:

```http
Cookie: refreshToken=<token>
```

Flow:

1. Validate Refresh Token
2. Verify Not Expired
3. Verify Not Revoked
4. Load Current Roles
5. Load Current Permissions
6. Generate Access Token
7. Generate Refresh Token
8. Rotate Refresh Token
9. Return Access Token
10. Set New Refresh Token Cookie

Response:

```json
{
  "accessToken": "<jwt>"
}
```

---

### POST /auth/logout

Request:

No Request Body

Browser Automatically Sends:

```http
Cookie: refreshToken=<token>
```

Flow:

1. Validate Refresh Token
2. Mark Revoked
3. Clear Cookie

Response:

```http
204 No Content
```

---

# 10. User Module

## Responsibilities

- User Management
- Role Management
- Permission Management

---

## Endpoints

### POST /users

Permission:

```text
user.create
```

Request:

```json
{
  "email": "user@test.com",
  "password": "Password@123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Flow:

1. Validate Request
2. Verify Unique Email
3. Hash Password
4. Create User

---

### GET /users/:id

Permission:

```text
user.read
```

Flow:

1. Validate JWT
2. Validate Permission
3. Retrieve User

---

### PATCH /users/:id

Permission:

```text
user.update
```

Flow:

1. Validate JWT
2. Validate Permission
3. Update User

---

### DELETE /users/:id

Permission:

```text
user.delete
```

Flow:

1. Validate JWT
2. Validate Permission
3. Mark User Inactive

---

### POST /users/:id/roles

Permission:

```text
role.assign
```

Assign Role To User.

---

### DELETE /users/:id/roles/:roleId

Permission:

```text
role.remove
```

Remove Role From User.

---

### POST /roles

Permission:

```text
role.create
```

Create Role.

---

### GET /roles

Permission:

```text
role.read
```

Retrieve Roles.

---

### POST /permissions

Permission:

```text
permission.create
```

Create Permission.

---

### GET /permissions

Permission:

```text
permission.read
```

Retrieve Permissions.

---

# 11. Seed Data

Roles:

```text
ADMIN
USER
```

Permissions:

```text
user.read
user.create
user.update
user.delete

role.create
role.read
role.assign
role.remove

permission.create
permission.read
```

ADMIN receives all permissions.

USER receives no administrative permissions.

---

# 12. Bootstrap Super Admin

On application startup:

1. Check whether an ADMIN user exists.
2. If not, create a default SUPER_ADMIN account.
3. Force password change on first login.

Environment Variables:

```text
BOOTSTRAP_ADMIN_EMAIL
BOOTSTRAP_ADMIN_PASSWORD
```

This guarantees the system always has at least one administrative user.

---

# 13. Security Requirements

- Argon2 Password Hashing
- RS256 JWT Signing
- HttpOnly Refresh Cookies
- Refresh Token Rotation
- Refresh Token Hashing
- Role-Based Authorization
- Permission-Based Authorization
- No Sensitive Information In JWT
- No Refresh Token Exposure To JavaScript

---

# 14. Acceptance Criteria

Authentication

- Login Works
- Refresh Works
- Logout Works

Authorization

- JwtAuthGuard Works
- PermissionGuard Works

User Management

- Create User
- Retrieve User
- Update User
- Deactivate User

Role Management

- Create Role
- Assign Role
- Remove Role

Permission Management

- Create Permission
- Retrieve Permission

Security

- Argon2 Hashing
- RS256 Signing
- HttpOnly Refresh Cookies
- Refresh Token Rotation
- Refresh Token Hashing

```

```
