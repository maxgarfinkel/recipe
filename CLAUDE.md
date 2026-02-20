# Recipes Project

A full-stack recipe management application.

- **Backend:** Spring Boot 3.3.5 (Java 21), PostgreSQL, Flyway migrations, Gradle
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS 4, Vitest, Axios
- **Database:** PostgreSQL (Docker Compose)

---

## Project Structure

```
recipes/
├── src/                     # Java backend
│   ├── main/java/com/maxgarfinkel/recipes/
│   │   ├── RecipesApplication.java     # Spring Boot entry point
│   │   ├── LocalCorsConfig.java        # CORS config (local profile only)
│   │   ├── ControllerAdvice.java       # Global exception handling
│   │   ├── ItemNotFound.java           # Custom 404 exception
│   │   ├── recipe/                     # Recipe domain (Controller/Service/Repository/Entity/DTO)
│   │   ├── ingredient/                 # Ingredient domain
│   │   └── unit/                       # Unit of measurement domain
│   ├── test/java/com/maxgarfinkel/recipes/
│   │   ├── SpringTestBase.java         # Base class for integration tests
│   │   ├── recipe/                     # Recipe integration + JPA tests
│   │   ├── ingredient/                 # Ingredient integration + WebMVC tests
│   │   └── unit/                       # Unit integration tests
│   └── main/resources/
│       ├── application.yaml            # Spring datasource config
│       └── db/migration/               # Flyway SQL migrations (V1–V3)
├── recipe-ui/               # React/TypeScript frontend
│   └── src/
│       ├── recipe/          # Recipe pages and components
│       ├── Ingredient/      # Ingredient search and management
│       ├── Unit/            # Unit classes (immutable)
│       ├── ingredientQuantity/
│       ├── testUtils/       # Shared test utilities (deferred promise helper)
│       ├── Types.ts         # Shared TypeScript interfaces
│       ├── apiHooks.ts      # React hooks for all API calls
│       ├── Header.tsx       # Navigation header
│       └── main.tsx         # App entry point + React Router routes
├── compose.yaml             # Docker Compose (PostgreSQL)
├── build.gradle             # Gradle build config
└── CLAUDE.md                # This file
```

---

## Running the Application

### Prerequisites
- Java 21
- Node.js / npm
- Docker (for PostgreSQL)

### Start the database
```bash
docker compose up
```

PostgreSQL runs on `localhost:5432`, database `mydatabase`, user `myuser`, password `secret`.

### Start the backend
```bash
./gradlew bootRun
```

Backend serves on `http://localhost:8080`.

### Start the frontend
```bash
cd recipe-ui
npm run dev
```

Frontend runs on `http://localhost:5173`. Vite proxies `/api/*` to `http://localhost:8080`.

---

## Build & Test

### Backend
```bash
./gradlew build       # Compile and produce JAR
./gradlew test        # Run JUnit tests
```

### Frontend
```bash
cd recipe-ui
npm run build         # TypeScript compile + Vite production build
npm run test          # Run Vitest
npm run lint          # ESLint
npm run preview       # Preview production build
```

---

## Architecture

### Backend: Layered Architecture

Each domain (recipe, ingredient, unit) follows the same pattern:

```
Controller → Service → Repository → JPA Entity
                              ↕
                             DTO
```

Key architectural principles:
- **Controller:** Handles incoming HTTP requests and maps them to service calls. We layer must not leak HTTP details.
- **Service:** Orchestrates application logic and delegates persistence to repository.
- **JPA Entity:** Act both as domain object and persistence entity.
- **Repository:** Handles database access.

- DTOs separate the API contract from JPA entities (avoids circular serialization).
- `@Profile("local")` on `LocalCorsConfig` means CORS is only relaxed in local dev.
- Global exception handling in `ControllerAdvice`; `ItemNotFound` maps to HTTP 404.
- Lombok (`@RequiredArgsConstructor`, `@Getter`, `@Setter`) reduces boilerplate.

**Data model relationships:**
- `Recipe` 1→N `IngredientQuantity` (join entity)
- `IngredientQuantity` N→1 `Ingredient`
- `Ingredient` N→1 `Unit`
- `Unit` has optional self-reference (base unit + conversion factor)

### Frontend: Feature-Based Structure

- **Routing** (in `main.tsx`):
  - `/` → `RecipeMenu` (recipe list)
  - `/recipe/:id` → `RecipePage` (recipe detail)
  - `/new-recipe` → `RecipeEditorPage` (create only currently)
  - `/manage-ingredients` → placeholder (not yet implemented)

- **API hooks** (`apiHooks.ts`): Each hook returns `{ data, loading, error, <callback> }`.
  Hooks use `useCallback` for memoized handlers. Named `useFetch*` / `useSave*`.

- **Unit classes** (`Unit/`): Immutable (`Object.freeze()`). Represent units of measurement with conversion support.

- **Styling**: Tailwind CSS 4 with custom theme (dark/mid/white palette, Roboto + Slabo fonts).
  Global styles in `index.css`. Some component-scoped CSS files also exist.

- **Markdown editor**: `@mdxeditor/editor` used for recipe method (instructions) field.

---

## API Endpoints

All endpoints are prefixed `/api/v1/`.

| Resource | Endpoints |
|----------|-----------|
| Recipes | `GET /api/v1/recipe/`, `GET /api/v1/recipe/{id}`, `POST /api/v1/recipe/`, `PUT /api/v1/recipe/{id}`, `DELETE /api/v1/recipe/{id}` |
| Ingredients | `GET /api/v1/ingredient/`, `POST /api/v1/ingredient/`, `PUT /api/v1/ingredient/{id}`, `DELETE /api/v1/ingredient/{id}` |
| Units | `GET /api/v1/unit/` |

---

## Database Migrations (Flyway)

| Migration | Description |
|-----------|-------------|
| `V1__Ingredient.sql` | Creates `unit` table (19 predefined units: g, kg, oz, ml, tbsp, etc.) and `ingredient` table |
| `V2__Recipe.sql` | Creates `recipe` and `ingredient_quantity` tables |
| `V3__Recipe_servings.sql` | Adds `servings` column to `recipe` |

---

## Testing Approach

### Backend
- JUnit 5 + AssertJ
- `SpringTestBase` base class for integration tests (sets up Spring context)
- Mix of full integration tests and `@WebMvcTest` controller-level tests
- integreation tests use live PostgreSQL instance via docker-compose

### Frontend
- Vitest with jsdom environment
- React Testing Library
- Axios is mocked for API hook tests
- `testUtils/` contains a `deferred()` helper to create controllable promises, used to test loading/error states

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `recipe-ui/vite.config.ts` | Vite config: React plugin, Tailwind plugin, `/api` proxy to `:8080` |
| `recipe-ui/tsconfig.app.json` | Strict TypeScript, ES2020 target, no unused variables/parameters |
| `recipe-ui/tailwind.config.ts` | Custom colors and fonts |
| `recipe-ui/eslint.config.js` | ESLint with TypeScript + React Hooks + React Refresh rules |
| `src/main/resources/application.yaml` | Spring datasource (PostgreSQL connection) |
| `compose.yaml` | Docker Compose for PostgreSQL |
| `build.gradle` | Gradle: Spring Boot 3.3.5, Flyway, PostgreSQL driver, Lombok, AssertJ |

---

## TODO

- TODO: Document the `/manage-ingredients` route once it is implemented.
- TODO: Document any authentication/authorization layer if one is added in future.
