/**
 * Country data with dial codes for phone number input
 * Used by CustomerSearch component
 */

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const countries: Country[] = [
  { name: "Chile", code: "CL", dialCode: "+56", flag: "🇨🇱" },
  { name: "Argentina", code: "AR", dialCode: "+54", flag: "🇦🇷" },
  { name: "Bolivia", code: "BO", dialCode: "+591", flag: "🇧🇴" },
  { name: "Brasil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Colombia", code: "CO", dialCode: "+57", flag: "🇨🇴" },
  { name: "Costa Rica", code: "CR", dialCode: "+506", flag: "🇨🇷" },
  { name: "Cuba", code: "CU", dialCode: "+53", flag: "🇨🇺" },
  { name: "Ecuador", code: "EC", dialCode: "+593", flag: "🇪🇨" },
  { name: "El Salvador", code: "SV", dialCode: "+503", flag: "🇸🇻" },
  { name: "España", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Estados Unidos", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Guatemala", code: "GT", dialCode: "+502", flag: "🇬🇹" },
  { name: "Honduras", code: "HN", dialCode: "+504", flag: "🇭🇳" },
  { name: "México", code: "MX", dialCode: "+52", flag: "🇲🇽" },
  { name: "Nicaragua", code: "NI", dialCode: "+505", flag: "🇳🇮" },
  { name: "Panamá", code: "PA", dialCode: "+507", flag: "🇵🇦" },
  { name: "Paraguay", code: "PY", dialCode: "+595", flag: "🇵🇾" },
  { name: "Perú", code: "PE", dialCode: "+51", flag: "🇵🇪" },
  { name: "República Dominicana", code: "DO", dialCode: "+1", flag: "🇩🇴" },
  { name: "Uruguay", code: "UY", dialCode: "+598", flag: "🇺🇾" },
  { name: "Venezuela", code: "VE", dialCode: "+58", flag: "🇻🇪" },
];

export function getCountryByDialCode(dialCode: string): Country | undefined {
  return countries.find((c) => c.dialCode === dialCode);
}

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

export function getCountryByName(name: string): Country | undefined {
  return countries.find((c) => c.name.toLowerCase() === name.toLowerCase());
}
