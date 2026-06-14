
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/iam',
  jwt: {
    privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH ?? './keys/private.key',
    publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH ?? './keys/public.key',
    accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION ?? '900s',
    refreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION ?? '30d',
    issuer: process.env.JWT_ISSUER ?? 'iam-service',
    audience: process.env.JWT_AUDIENCE ?? 'iam-client',
  },
});
