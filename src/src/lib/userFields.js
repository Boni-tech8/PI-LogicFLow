// Nomes dos campos do model User no schema.prisma.
// Se algum for diferente no seu schema, mude só aqui.
export const F = {
  name: 'name',
  phone: 'phone',
  passwordHash: 'passwordHash',
  role: 'role',
};

// Consentimento LGPD (RN01). Se o User tiver um campo para isso, preencha:
// export const LGPD = { field: 'lgpdConsentAt', value: () => new Date() };
export const LGPD = null;