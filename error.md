

1/1

Next.js 15.5.15 (outdated)
Webpack
Build Error


  × Unexpected token. Did you mean `{'}'}` or `&rbrace;`?

./src/presentation/components/orders/wizard/OrderWizardContent.tsx

Error:   × Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
      ╭─[C:\Users\usuario\Documents\SISGO\sisgo-unificado\src\presentation\components\orders\wizard\OrderWizardContent.tsx:1676:1]
 1673 │               </div>
 1674 │             )}
 1675 │           </div>
 1676 │         ))}
      ·           ▲
 1677 │ 
 1678 │         {/* Botón para agregar otro equipo */}
 1678 │         <div className="flex justify-center">
      ╰────
  × Expected '</', got 'jsx text (
  │
  │       )'
      ╭─[C:\Users\usuario\Documents\SISGO\sisgo-unificado\src\presentation\components\orders\wizard\OrderWizardContent.tsx:1865:1]
 1862 │                   : `Crear Orden${devices.length > 1 ? ` (${devices.length} equipos)` : ""}`}
 1863 │               </button>
 1864 │             </div>
 1865 │ ╭─▶       </form>
 1866 │ │   
 1867 │ ╰─▶       {/* PDFPreview fuera del formulario para evitar que los botones disparen el submit */}
 1868 │           {/* Mostrar preview de todos los equipos en una sola orden */}
 1869 │           {showPDFPreview && createdOrder && devices.length > 0 && (
 1869 │             <PDFPreview
      ╰────

Caused by:
    Syntax Error

Import trace for requested module:
./src/presentation/components/orders/wizard/OrderWizardContent.tsx
./src/presentation/components/orders/wizard/OrderWizard.tsx