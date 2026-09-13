# Project Restructure Plan

## 1. Enforce Separation of Concerns (Routes → Controllers → Services → Models)

- **Routes**: Should only map HTTP methods/paths to controller functions. No business logic, no DB calls.
- **Controllers**: Handle the request/response cycle only — parse input, call the appropriate service, format and send the response (status codes, JSON/view rendering). No direct DB or model queries here.
- **Services**: Own all business logic. This is where validation rules, calculations, orchestration between multiple models, and core "what the app actually does" lives.
- **Models**: Handle only data access/schema definitions — no business logic leaking in here either.

**Flow:** `Route → Controller → Service → Model → DB`

## 2. Reorganize EJS Views by Feature/Domain

Instead of dumping all `.ejs` files in one `views/` folder, group them by module for easier navigation and scaling:

```
views/
  users/
    profile.ejs
    settings.ejs
  products/
    list.ejs
    detail.ejs
  shared/
    header.ejs
    footer.ejs
    layout.ejs
```

## A Few Additions to Consider

- **Add a `middlewares/` folder** for auth checks, error handling, request validation, and logging — keep these out of controllers too.
- **Centralize error handling** with a single error-handling middleware instead of try/catch scattered everywhere; have services throw custom error objects/classes that the middleware interprets.
- **Add a `utils/` or `helpers/` folder** for reusable logic (formatters, date utils, etc.) that doesn't belong in services.
- **Use a `config/` folder** for environment variables, DB connection setup, and constants — avoid hardcoding.
- **Consider a `validators/` layer** (e.g., using Joi or express-validator) so input validation happens before it even reaches the controller.
- **Keep a consistent naming convention** across layers (e.g., `user.routes.js`, `user.controller.js`, `user.service.js`, `user.model.js`) so related files are easy to spot.
- **Write unit tests per service**, since business logic is now isolated there — this becomes much easier once services don't depend on Express req/res objects.

This structure keeps each layer testable independently and makes onboarding new devs to the codebase far simpler.

- ** Follow dev-rules.md and inforce it 