// Lista de países con códigos de teléfono y banderas
export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const countries: Country[] = [
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱" },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { code: "BO", name: "Bolivia", dialCode: "+591", flag: "🇧🇴" },
  { code: "BR", name: "Brasil", dialCode: "+55", flag: "🇧🇷" },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica", dialCode: "+506", flag: "🇨🇷" },
  { code: "CU", name: "Cuba", dialCode: "+53", flag: "🇨🇺" },
  { code: "DO", name: "República Dominicana", dialCode: "+1", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", dialCode: "+593", flag: "🇪🇨" },
  { code: "SV", name: "El Salvador", dialCode: "+503", flag: "🇸🇻" },
  { code: "GT", name: "Guatemala", dialCode: "+502", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", dialCode: "+504", flag: "🇭🇳" },
  { code: "MX", name: "México", dialCode: "+52", flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua", dialCode: "+505", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", dialCode: "+507", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay", dialCode: "+595", flag: "🇵🇾" },
  { code: "PE", name: "Perú", dialCode: "+51", flag: "🇵🇪" },
  { code: "PR", name: "Puerto Rico", dialCode: "+1", flag: "🇵🇷" },
  { code: "UY", name: "Uruguay", dialCode: "+598", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", dialCode: "+58", flag: "🇻🇪" },
  { code: "US", name: "Estados Unidos", dialCode: "+1", flag: "🇺🇸" },
  { code: "ES", name: "España", dialCode: "+34", flag: "🇪🇸" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "FR", name: "Francia", dialCode: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italia", dialCode: "+39", flag: "🇮🇹" },
  { code: "DE", name: "Alemania", dialCode: "+49", flag: "🇩🇪" },
  { code: "GB", name: "Reino Unido", dialCode: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canadá", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "NZ", name: "Nueva Zelanda", dialCode: "+64", flag: "🇳🇿" },
  { code: "JP", name: "Japón", dialCode: "+81", flag: "🇯🇵" },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "KR", name: "Corea del Sur", dialCode: "+82", flag: "🇰🇷" },
];

export function getCountryByDialCode(dialCode: string): Country | undefined {
  return countries.find((c) => c.dialCode === dialCode);
}

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}



