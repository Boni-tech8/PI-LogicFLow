import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET', 'OTP_PEPPER'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Variável de ambiente ausente: ${key}`);
}

export const env = {
  JWT_SECRET: process.env.JWT_SECRET,
  OTP_PEPPER: process.env.OTP_PEPPER,
  PUBLIC_URL: process.env.PUBLIC_URL ?? 'http://localhost:3333',
  PORT: Number(process.env.PORT ?? 3333),
  isProd: process.env.NODE_ENV === 'production',
};
