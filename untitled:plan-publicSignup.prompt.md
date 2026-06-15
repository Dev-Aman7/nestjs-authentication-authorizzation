Steps:
1) Add imports and inject `UsersService` into the `AuthController` constructor.
2) Add a public `POST /auth/signup` handler that creates the user, issues access and refresh tokens, hashes and stores the refresh token, sets the refresh cookie, and returns the access token and user info.
3) Rebuild/restart the app (locally or via Docker) and test the signup flow.

Details:
- File to modify: `src/modules/auth/auth.controller.ts`
- Add imports: `UsersService`, `CreateUserDto`, and `argon2` (or use existing hashing utilities).
- Constructor injection: include `private readonly usersService: UsersService`.
- Signup handler behavior:
  - Validate request via existing `CreateUserDto` (global ValidationPipe handles this).
  - Call `this.usersService.create(createUserDto)`.
  - Generate access token via `this.authService.createAccessToken(userId, user)`.
  - Generate refresh token via `this.authService.createRefreshToken(userId)`.
  - Hash refresh token with `argon2.hash(refreshToken)` and store with `this.usersService.setCurrentRefreshToken(hashed, userId)`.
  - Set refresh cookie using same options as `login` (`httpOnly`, `secure` in production, `sameSite: 'strict'`, `path: REFRESH_TOKEN_PATH`, `maxAge` 30 days).
  - Return `{ accessToken, user: { id, email, roles, permissions } }` with HTTP 201.

Testing (after restart):

Local:
```
npm run start:dev
```

Docker:
```
docker compose build app
docker compose up -d
```

Signup curl example:
```
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"supersecret","roles":["USER"]}'
```

Notes / Next steps:
- Ensure `UsersModule` is imported in `AuthModule` (already present).
- If you want auto-login on signup, set the refresh cookie as above and return the access token (plan reflects this).
- Consider rate-limiting / CAPTCHA / email verification for public signup to prevent abuse.
