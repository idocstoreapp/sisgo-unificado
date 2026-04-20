# 👨‍💻 Guía de Desarrollo - SISGO Unificado

## Arquitectura General

### Clean Architecture en 4 Capas

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION (Componentes React, Hooks, UI)                │
│  - React Components                                         │
│  - Custom Hooks                                             │
│  - Pages (Next.js App Router)                               │
└────────────────────┬────────────────────────────────────────┘
                     │ usa
┌────────────────────▼────────────────────────────────────────┐
│  APPLICATION (Casos de Uso, DTOs, DI)                       │
│  - Use Cases (CreateOrderUseCase, etc.)                    │
│  - DTOs (Data Transfer Objects)                             │
│  - DI Container                                             │
└────────────────────┬────────────────────────────────────────┘
                     │ usa
┌────────────────────▼────────────────────────────────────────┐
│  DOMAIN (Entidades, Value Objects, Interfaces)              │
│  - Entities (Company, WorkOrder, Quote, etc.)              │
│  - Value Objects (Money, Email, Phone)                      │
│  - Repository Interfaces                                   │
└────────────────────┬────────────────────────────────────────┘
                     │ implementada por
┌────────────────────▼────────────────────────────────────────┐
│  INFRASTRUCTURE (Supabase, Auth, External Services)         │
│  - Supabase Repositories                                   │
│  - Mappers                                                  │
│  - External APIs                                            │
└─────────────────────────────────────────────────────────────┘
```

### Reglas de Dependencia
- ✅ Presentation → Application → Domain
- ✅ Infrastructure → Domain
- ❌ Domain NUNCA depende de Application o Infrastructure
- ❌ Application NUNCA depende de Infrastructure directamente

---

## Estructura de Carpetas Detallada

```
sisgo-unificado/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Company.ts              # Empresa con validaciones
│   │   │   ├── Branch.ts               # Sucursal
│   │   │   ├── User.ts                 # Usuario del sistema
│   │   │   ├── Customer.ts             # Cliente
│   │   │   ├── WorkOrder.ts            # Orden de trabajo
│   │   │   ├── Quote.ts                # Cotización
│   │   │   ├── Product.ts              # Producto/Servicio
│   │   │   ├── Material.ts             # Material/Repuesto
│   │   │   ├── Service.ts              # Servicio de reparación
│   │   │   ├── FurnitureCatalog.ts     # Catálogo de muebles
│   │   │   ├── Inventory.ts            # Entidades de inventario
│   │   │   ├── Restaurant.ts           # Entidades de restaurante
│   │   │   ├── EmployeePayment.ts      # Pagos a empleados
│   │   │   ├── Expense.ts              # Gastos
│   │   │   ├── SavingsFund.ts          # Caja de ahorro
│   │   │   └── SalaryAdjustment.ts     # Ajustes de sueldo
│   │   │
│   │   ├── value-objects/
│   │   │   ├── Money.ts                # Value Object para dinero
│   │   │   ├── Email.ts                # Value Object para email
│   │   │   └── Phone.ts                # Value Object para teléfono
│   │   │
│   │   └── repositories/
│   │       ├── ICompanyRepository.ts
│   │       ├── IBranchRepository.ts
│   │       ├── IUserRepository.ts
│   │       ├── IWorkOrderRepository.ts
│   │       ├── IQuoteRepository.ts
│   │       └── ... (15 interfaces total)
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── RegisterCompanyUseCase.ts
│   │   │   ├── CreateUserUseCase.ts
│   │   │   ├── CreateOrderUseCase.ts
│   │   │   ├── UpdateOrderStatusUseCase.ts
│   │   │   ├── FinanceUseCases.ts      # Múltiples casos de uso de finanzas
│   │   │   ├── QuoteUseCases.ts        # Casos de uso de cotizaciones
│   │   │   ├── InventoryUseCases.ts    # Casos de uso de inventario
│   │   │   └── RestaurantUseCases.ts   # Casos de uso de restaurante
│   │   │
│   │   ├── dtos/
│   │   │   ├── CreateCompanyDTO.ts
│   │   │   ├── OrderDTOs.ts
│   │   │   ├── FinanceDTOs.ts
│   │   │   ├── QuoteDTOs.ts
│   │   │   ├── InventoryDTOs.ts
│   │   │   └── ReportDTOs.ts
│   │   │
│   │   └── di-container.ts             # Dependency Injection Container
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── supabase/
│   │   │       ├── client.ts           # Browser client
│   │   │       ├── admin-client.ts     # Admin client (server-only)
│   │   │       ├── server.ts           # Server client with cookies
│   │   │       ├── database.types.ts   # TypeScript types generados
│   │   │       ├── mappers.ts          # Mappers entity ↔ database
│   │   │       └── repositories/
│   │   │           ├── SupabaseCompanyRepository.ts
│   │   │           ├── SupabaseWorkOrderRepository.ts
│   │   │           ├── SupabaseQuoteRepository.ts
│   │   │           └── ... (15+ repositorios)
│   │   │
│   │   └── auth/
│   │       ├── authService.ts          # Supabase Auth helpers
│   │       └── middleware.ts           # Next.js middleware
│   │
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── ui/                     # Componentes base (shadcn/ui style)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── OrderForm.tsx
│   │   │   │   └── OrdersList.tsx
│   │   │   │
│   │   │   ├── quotes/
│   │   │   │   ├── QuoteForm.tsx
│   │   │   │   ├── QuotesList.tsx
│   │   │   │   └── QuoteDetail.tsx
│   │   │   │
│   │   │   ├── finance/
│   │   │   │   └── FinanceDashboard.tsx
│   │   │   │
│   │   │   ├── inventory/
│   │   │   │   └── InventoryDashboard.tsx
│   │   │   │
│   │   │   ├── restaurant/
│   │   │   │   └── RestaurantDashboard.tsx
│   │   │   │
│   │   │   └── reports/
│   │   │       └── ReportsDashboard.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useCompany.ts
│   │   │   ├── usePermissions.ts
│   │   │   ├── useOrders.ts
│   │   │   ├── useFinance.ts
│   │   │   ├── useQuotes.ts
│   │   │   ├── useInventory.ts
│   │   │   └── useRestaurant.ts
│   │   │
│   │   └── providers/
│   │       ├── Providers.tsx
│   │       └── ReactQueryProvider.tsx
│   │
│   ├── shared/
│   │   ├── kernel/
│   │   │   ├── Result.ts               # Result monad
│   │   │   ├── Either.ts               # Either monad
│   │   │   ├── errors.ts               # Error types
│   │   │   ├── types.ts                # Types base
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts                   # clsx + tailwind-merge
│   │   │   ├── currency.ts             # Formato de moneda
│   │   │   └── date.ts                 # Helpers de fechas
│   │   │
│   │   └── constants/
│   │       └── index.ts
│   │
│   └── app/                            # Next.js App Router
│       ├── layout.tsx
│       ├── page.tsx
│       ├── globals.css
│       ├── actions.ts                  # Server Actions
│       ├── (auth)/
│       │   ├── login/page.tsx
│       │   └── register/page.tsx
│       └── (dashboard)/
│           ├── layout.tsx              # Dashboard layout con sidebar
│           ├── page.tsx                # Dashboard home
│           ├── orders/page.tsx
│           ├── orders/new/page.tsx
│           ├── quotes/page.tsx
│           ├── quotes/[id]/page.tsx
│           ├── branches/page.tsx
│           ├── users/page.tsx
│           ├── finance/page.tsx
│           ├── inventory/page.tsx
│           ├── restaurant/page.tsx
│           └── reports/page.tsx
│
├── tests/
│   ├── setup.ts
│   └── domain/
│       └── entities/
│           ├── Company.test.ts
│           ├── Quote.test.ts
│           └── WorkOrder.test.ts
│
├── docs/
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md (este archivo)
│
└── [config files]
```

---

## Patrones de Diseño

### 1. Result Monad
Usado para manejar errores de forma funcional:

```typescript
import { Result, ValidationError } from "@/shared/kernel";

function divide(a: number, b: number): Result<number, ValidationError> {
  if (b === 0) {
    return Result.fail(new ValidationError("Cannot divide by zero"));
  }
  return Result.ok(a / b);
}

const result = divide(10, 2);
if (result.isSuccess) {
  console.log(result.getValue()); // 5
} else {
  console.error(result.getError().message);
}
```

### 2. Entity Pattern
Entidades con validación encapsulada:

```typescript
export class Company {
  private constructor(private props: CompanyProps) {}

  static create(props: CreateProps): Result<Company, ValidationError> {
    // Validaciones
    if (!props.name) {
      return Result.fail(new ValidationError("Name is required"));
    }
    
    return Result.ok(new Company(props));
  }

  updateName(name: string): Result<void, ValidationError> {
    if (!name) {
      return Result.fail(new ValidationError("Name is required"));
    }
    this.props.name = name;
    return Result.ok(undefined);
  }
}
```

### 3. Repository Pattern
Interfaces que abstraen el acceso a datos:

```typescript
// Domain layer
export interface ICompanyRepository {
  findById(id: string): Promise<Result<Company, Error>>;
  create(company: Company): Promise<Result<Company, Error>>;
}

// Infrastructure layer
export class SupabaseCompanyRepository implements ICompanyRepository {
  async findById(id: string): Promise<Result<Company, Error>> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      return Result.fail(new RepositoryError(error.message));
    }
    
    return Result.ok(mapper.toEntity(data));
  }
}
```

### 4. Use Case Pattern
Casos de uso que encapsulan lógica de negocio:

```typescript
export class CreateOrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(input: CreateOrderDTO): Promise<Result<OrderDTO, Error>> {
    // 1. Validar input
    // 2. Crear entidad
    // 3. Persistir
    // 4. Retornar DTO
  }
}
```

### 5. Dependency Injection
Container que wired dependencies:

```typescript
// di-container.ts
const companyRepository = new SupabaseCompanyRepository();
const userRepository = new SupabaseUserRepository();

export const registerCompanyUseCase = new RegisterCompanyUseCase(
  companyRepository,
  userRepository
);
```

---

## Flujo de Trabajo

### 1. Agregar Nueva Entidad

#### a) Crear Entity en Domain
```typescript
// src/domain/entities/NewEntity.ts
export interface NewEntityProps {
  id: string;
  name: string;
  // ...
}

export class NewEntity {
  private constructor(private props: NewEntityProps) {}

  static create(props: Omit<NewEntityProps, "createdAt">): Result<NewEntity, ValidationError> {
    // Validaciones
    if (!props.name) {
      return Result.fail(new ValidationError("Name is required"));
    }

    return Result.ok(new NewEntity({
      ...props,
      createdAt: new Date(),
    }));
  }

  // Getters y métodos
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
}
```

#### b) Crear Interfaz de Repositorio
```typescript
// src/domain/repositories/INewEntityRepository.ts
export interface INewEntityRepository {
  findById(id: string): Promise<Result<NewEntity, Error>>;
  findByCompany(companyId: string): Promise<Result<NewEntity[], Error>>;
  create(entity: NewEntity): Promise<Result<NewEntity, Error>>;
  update(entity: NewEntity): Promise<Result<NewEntity, Error>>;
  delete(id: string): Promise<Result<void, Error>>;
}
```

#### c) Implementar Repositorio en Supabase
```typescript
// src/infrastructure/database/supabase/repositories/SupabaseNewEntityRepository.ts
export class SupabaseNewEntityRepository implements INewEntityRepository {
  async findById(id: string): Promise<Result<NewEntity, Error>> {
    const supabase = getSupabaseAdmin();
    // ... implementación
  }

  // ... otros métodos
}
```

#### d) Crear Mapper
```typescript
// src/infrastructure/database/supabase/mappers.ts
export const newEntityMapper = {
  toEntity(data: any): NewEntity {
    return NewEntity.create({
      id: data.id,
      name: data.name,
      // ...
    }).unwrap();
  },

  toInsert(entity: NewEntity): any {
    return {
      id: entity.id,
      name: entity.name,
      // ...
    };
  }
};
```

#### e) Crear DTO
```typescript
// src/application/dtos/NewEntityDTO.ts
export interface CreateNewEntityDTO {
  name: string;
  // ...
}

export interface NewEntityDTO {
  id: string;
  name: string;
  // ...
}
```

#### f) Crear Caso de Uso
```typescript
// src/application/use-cases/CreateNewEntityUseCase.ts
export class CreateNewEntityUseCase {
  constructor(private readonly repository: INewEntityRepository) {}

  async execute(input: CreateNewEntityDTO): Promise<Result<NewEntityDTO, Error>> {
    const entityResult = NewEntity.create(input);
    if (entityResult.isFailure) {
      return Result.fail(entityResult.getError());
    }

    const savedResult = await this.repository.create(entityResult.getValue());
    if (savedResult.isFailure) {
      return Result.fail(savedResult.getError());
    }

    const entity = savedResult.getValue();
    return Result.ok({
      id: entity.id,
      name: entity.name,
      // ...
    });
  }
}
```

#### g) Registrar en DI Container
```typescript
// src/application/di-container.ts
import { SupabaseNewEntityRepository } from "@/infrastructure/...";
import { CreateNewEntityUseCase } from "@/application/...";

const newEntityRepository = new SupabaseNewEntityRepository();
export const createNewEntityUseCase = new CreateNewEntityUseCase(newEntityRepository);
```

#### h) Crear Hook
```typescript
// src/presentation/hooks/useNewEntity.ts
export function useNewEntity() {
  const [isLoading, setIsLoading] = useState(false);

  const createEntity = useCallback(async (input: CreateNewEntityDTO) => {
    setIsLoading(true);
    const result = await createNewEntityUseCase.execute(input);
    setIsLoading(false);
    
    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }
    return { success: true, data: result.getValue() };
  }, []);

  return { isLoading, createEntity };
}
```

#### i) Crear Componente UI
```typescript
// src/presentation/components/new-entity/NewEntityForm.tsx
export function NewEntityForm() {
  const { isLoading, createEntity } = useNewEntity();

  const handleSubmit = async (data: FormData) => {
    const result = await createEntity({
      name: data.get("name") as string,
      // ...
    });

    if (result.success) {
      toast.success("Entity created!");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

#### j) Agregar Ruta en App Router
```typescript
// src/app/(dashboard)/new-entity/page.tsx
export default function NewEntityPage() {
  return (
    <div>
      <h1>New Entity</h1>
      <NewEntityForm />
    </div>
  );
}
```

---

## Testing

### Tests de Entidades
```typescript
describe('Company Entity', () => {
  it('should create a valid company', () => {
    const result = Company.create({
      name: 'Test Company',
      businessType: 'servicio_tecnico',
      ivaPercentage: 19,
      commissionPercentage: 40,
    });

    expect(result.isSuccess).toBe(true);
  });

  it('should fail if name is empty', () => {
    const result = Company.create({
      name: '',
      businessType: 'servicio_tecnico',
    });

    expect(result.isFailure).toBe(true);
  });
});
```

### Tests de Casos de Uso
```typescript
describe('CreateOrderUseCase', () => {
  it('should create an order successfully', async () => {
    const mockRepository = {
      create: vi.fn().mockResolvedValue(Result.ok(mockOrder)),
      getNextOrderNumber: vi.fn().mockResolvedValue(Result.ok('OT-2026-0001')),
    };

    const useCase = new CreateOrderUseCase(mockRepository);
    const result = await useCase.execute(validInput);

    expect(result.isSuccess).toBe(true);
    expect(mockRepository.create).toHaveBeenCalledWith(expectedOrder);
  });
});
```

---

## Buenas Prácticas

### ✅ DO
- Separar responsabilidades (una clase = una responsabilidad)
- Usar Result/Either para manejo de errores
- Validar en entidades y casos de uso
- Escribir tests para lógica de negocio crítica
- Mantener componentes pequeños (< 300 líneas)
- Usar TypeScript estricto
- Documentar decisiones arquitectónicas

### ❌ DON'T
- No llamar a Supabase directamente desde componentes
- No mezclar capas (UI con lógica de negocio)
- No hacer componentes de 1000+ líneas
- No ignorar los tests
- No hardcodear valores de configuración
- No bypass RLS policies

---

## Solución de Problemas Comunes

### Error: "next/headers in client component"
**Problema:** Importar `next/headers` en componentes de cliente.

**Solución:** Usar `admin-client.ts` en lugar de `server.ts` para repositorios.

### Error: "Invalid status transition"
**Problema:** Transición de estado inválida.

**Solución:** Revisar las reglas de negocio en `changeStatus()` del entity.

### Error: "Missing Supabase environment variables"
**Problema:** Variables de entorno no configuradas.

**Solución:** Crear `.env.local` con las credenciales de Supabase.

---

## Recursos Adicionales

- [Documentación Oficial de Next.js](https://nextjs.org/docs)
- [Clean Architecture por Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Result Pattern](https://enterprisecraftsmanship.com/posts/result-class/)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)

---

**Última actualización:** 14 de abril de 2026
