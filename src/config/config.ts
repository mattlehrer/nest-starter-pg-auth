export default () => ({
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
  },
  jwt: {
    expiresIn: process.env.EXPIRES_IN || '1d',
    secret: process.env.JWT_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
});
