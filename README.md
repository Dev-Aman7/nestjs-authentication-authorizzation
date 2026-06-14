# NestJS Authentication & Authorization

A public open-source NestJS IAM service with authentication, authorization, refresh token support, and MongoDB persistence.

> ⭐ If you find this project useful, please star the repo on GitHub and consider contributing!

## Features

- JWT authentication and refresh token flow
- Role/permission-based authorization
- MongoDB via Mongoose
- Swagger API documentation
- Docker Compose for app + MongoDB

## Requirements

- Node.js 20+
- npm
- Docker (for Docker Compose setup)

## Setup

```bash
cd /Users/amankumar/Desktop/Projects/nestjs-authentication-authorizzation
npm install
```

## Run Locally

```bash
npm run start:dev
```

The app runs on `http://localhost:3000` by default.

## Run with Docker

Start the services with Docker Compose:

```bash
docker compose up -d
```

> If your system still uses `docker-compose`, use:
>
> ```bash
docker-compose up -d
> ```

The project already includes a `mongo` service at `mongo:7.0`.

## Docker Compose Services

- `app`: Node/NestJS application
- `mongo`: MongoDB database

### Service configuration

- `MONGO_URI=mongodb://mongo:27017/iam`
- `JWT_PRIVATE_KEY_PATH=/usr/src/app/keys/private.key`
- `JWT_PUBLIC_KEY_PATH=/usr/src/app/keys/public.key`
- `JWT_ACCESS_TOKEN_EXPIRATION=900s`
- `JWT_REFRESH_TOKEN_EXPIRATION=30d`
- `JWT_ISSUER=iam-service`
- `JWT_AUDIENCE=iam-client`
- `PORT=3000`

## Swagger

The API docs are available at:

```bash
http://localhost:3000/api
```

The OpenAPI JSON is available at:

```bash
http://localhost:3000/api-json
```

## Contributing

This project is public and contributions are welcome. If you'd like to help, please:

- star the repo on GitHub
- open issues for bugs or feature requests
- submit pull requests for improvements

## Common Commands

```bash
npm run build
npm run start
npm run lint
npm run test
npm run format
```

## Notes

- `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }))` is configured to validate request DTOs globally.
- The Docker setup builds the app image and starts MongoDB with a named volume `mongo-data`.
