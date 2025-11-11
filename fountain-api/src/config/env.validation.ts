import * as Joi from 'joi';

/**
 * Validation das envs atuais usadas pelo projeto.
 * Falha no boot se faltar alguma essencial.
 */
export const validationSchema = Joi.object({
  // ===== Server =====
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  USD_BRL_RATE: Joi.number().default(5.25),

  // ===== Supabase =====
  SUPABASE_URL: Joi.string().uri().required().messages({
    'any.required': 'SUPABASE_URL é obrigatória.',
    'string.uri': 'SUPABASE_URL deve ser uma URL válida.',
  }),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(),
  SUPABASE_ANON_KEY: Joi.string().optional(),

  // ===== JWT =====
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_SECRET é obrigatória (mín. 32 chars).',
    'string.min': 'JWT_SECRET deve ter pelo menos 32 caracteres.',
  }),
  JWT_EXPIRATION: Joi.string().default('7d'),

  // ===== XRPL =====
  XRPL_NETWORK: Joi.string().valid('testnet', 'mainnet').default('testnet'),
  XRPL_ISSUER_ADDRESS: Joi.string().optional(),
  XRPL_ISSUER_SEED: Joi.string().optional(),
  ENABLE_XRPL_SUBSCRIBER: Joi.string().valid('true', 'false').default('true'),
  ENABLE_XRPL_POLLING_FALLBACK: Joi.string().valid('true', 'false').default('false'),
})
  .unknown(true)
  .custom((value, helpers) => {
    // Exigir pelo menos uma chave do Supabase
    if (!value.SUPABASE_SERVICE_ROLE_KEY && !value.SUPABASE_ANON_KEY) {
      return helpers.error('any.custom', {
        message:
          'Defina SUPABASE_SERVICE_ROLE_KEY (preferível) ou SUPABASE_ANON_KEY para conectar ao Supabase.',
      });
    }
    return value;
  });
