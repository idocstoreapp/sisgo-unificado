-- =====================================================
-- SISGO - ONBOARDING ADAPTATIVO Y TRIAL
-- =====================================================
-- El modelo no agrega columnas: usa companies.config para evitar migraciones
-- destructivas durante piloto. Nuevas empresas reciben esta estructura desde
-- RegisterCompanyUseCase.

UPDATE companies
SET config = COALESCE(config, '{}'::jsonb)
  || jsonb_build_object(
    'companyMode', COALESCE(config->>'companyMode', 'team'),
    'features', COALESCE(
      config->'features',
      jsonb_build_object(
        'technicians', true,
        'technicianPayments', false,
        'multiBranch', false,
        'team', true
      )
    ),
    'trial', COALESCE(
      config->'trial',
      jsonb_build_object(
        'status', 'active',
        'startedAt', NOW(),
        'endsAt', NOW() + INTERVAL '7 days',
        'daysTotal', 7
      )
    )
  )
WHERE config IS NULL
   OR NOT (config ? 'companyMode')
   OR NOT (config ? 'features')
   OR NOT (config ? 'trial');

COMMENT ON COLUMN companies.config IS
  'JSON config: onboarding.companySize/usageMode, companyMode, features, trial status/dates.';
