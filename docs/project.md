# IAM Service - Architecture & Project Design

## 1. Overview

The IAM (Identity and Access Management) Service is a modular monolith built using NestJS.

The service is responsible for:

- Authentication
- Authorization
- User Management
- Role Management
- Permission Management
- Session Management (Refresh Tokens)

The service acts as the central identity provider for applications within the ecosystem.

---

# 2. Architecture Style

Architecture: Modular Monolith

Business Modules:

- Auth Module
- User Module

Application Layer:

Controller
↓
Service
↓
Mongoose
↓
MongoDB

---

# 3. Technology Stack

## Backend

- NestJS
- TypeScript

## Database

- MongoDB

## ODM

- Mongoose

## Authentication

- JWT (RS256)

## Password Hashing

- Argon2

## Validation

- class-validator
- class-transformer

## API Documentation

- Swagger

## Containerization

- Docker

## Testing

- Jest

---

# 4. Business Modules

## Auth Module

Responsibilities:

- Login
- Logout
- Refresh Token
- JWT Generation
- JWT Validation
- Password Validation

Owns:

- Authentication Logic
- Access Tokens
- Refresh Tokens

---

## User Module

Responsibilities:

- Create User
- Update User
- Deactivate User
- Retrieve User
- Manage Roles
- Manage Permissions

Owns:

- Users
- Roles
- Permissions

---

# 5. Project Structure

.
├── keys/
│ ├── private.key
│ └── public.key
├── .husky/
│ ├── pre-commit
│ └── commit-msg
│
├── src/
│
│ ├── modules/
│ │
│ │ ├── auth/
│ │ │
│ │ │ ├── controllers/
│ │ │ ├── services/
│ │ │ ├── guards/
│ │ │ ├── strategies/
│ │ │ ├── decorators/
│ │ │ ├── schemas/
│ │ │ ├── dto/
│ │ │ └── auth.module.ts
│ │
│ │ ├── users/
│ │ │
│ │ │ ├── controllers/
│ │ │ ├── services/
│ │ │ ├── schemas/
│ │ │ ├── dto/
│ │ │ ├── enums/
│ │ │ └── users.module.ts
│ │
│ ├── shared/
│ │
│ │ ├── constants/
│ │ ├── decorators/
│ │ ├── exceptions/
│ │ ├── interfaces/
│ │ ├── types/
│ │ └── utils/
│ │
│ ├── infrastructure/
│ │
│ │ ├── config/
│ │ ├── database/
│ │ └── logger/
│ │
│ ├── app.module.ts
│ └── main.ts
│
├── test/
│ ├── unit/
│ ├── integration/
│ └── e2e/
│
├── .env
├── .env.example
├── .eslintignore
├── .eslintrc.js
├── .gitignore
├── .prettierignore
├── .prettierrc
├── commitlint.config.js
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── Dockerfile
├── docker-compose.yml
└── README.md

---

# 6. Security Design

## Password Storage

Argon2

## JWT Signing Algorithm

RS256

Token Generation:

- Private Key

Token Verification:

- Public Key

## Access Token Lifetime

15 Minutes

## Refresh Token Lifetime

30 Days

## Refresh Token Rotation

Enabled

## Refresh Token Storage

Only hashed refresh tokens are stored.

Plain-text refresh tokens are never persisted.

---

# 7. Authorization Model

Role-Based Access Control (RBAC)

User
↓
Role
↓
Permission

Example:

ADMIN

Permissions:

- user.read
- user.create
- user.update
- user.delete
- role.assign
- role.remove

---

# 8. MongoDB Collections

users

roles

permissions

refresh_tokens

---

# 9. Collection Responsibilities

## users

Stores:

- User profile
- Credentials
- Assigned roles

---

## roles

Stores:

- Role definitions
- Assigned permissions

---

## permissions

Stores:

- Available permissions

Examples:

- user.read
- user.create
- user.update
- user.delete

---

## refresh_tokens

Stores:

- Hashed refresh tokens
- Expiration information
- Revocation status

---

# Environment Variables

JWT_PRIVATE_KEY_PATH=keys/private.key

JWT_PUBLIC_KEY_PATH=keys/public.key

ACCESS_TOKEN_EXPIRY=15m

REFRESH_TOKEN_EXPIRY=30d

BOOTSTRAP_ADMIN_EMAIL=admin@example.com

BOOTSTRAP_ADMIN_PASSWORD=StrongPassword123

# 10. Excluded From V1

The following capabilities are intentionally excluded:

- MFA
- OAuth2
- OpenID Connect
- Social Login
- SSO
- Audit Logging
- Organization Management
- Multi-Tenancy
- Session Analytics
