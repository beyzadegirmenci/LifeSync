# LifeSync Test Report

**Report date:** 2026-04-14  
**Project:** LifeSync  
**Repository:** [beyzadegirmenci/LifeSync](https://github.com/beyzadegirmenci/LifeSync)

## 1. Test Responsibles

| Area | Responsible |
|---|---|
| Test execution and report preparation | Local QA / automation run in current workspace |
| Backend unit test ownership | Backend development team |
| Frontend smoke flow ownership | Frontend and QA automation |
| Repository contributors referenced for project ownership | `Mehmet Eski`, `Kerem Elma` |

## 2. Test Date

| Activity | Date | Status |
|---|---|---|
| Backend unit test execution | 2026-04-14 | Completed |
| Frontend production build validation | 2026-04-14 | Completed |
| Selenium end-to-end smoke validation | 2026-04-14 | Completed |

## 3. Test Configuration

### Environment

| Item | Value |
|---|---|
| OS | Windows (PowerShell environment) |
| Frontend URL | `http://localhost:5173` |
| Backend URL | `http://localhost:5000` |
| Backend API base | `http://localhost:5000/api` |
| Database | PostgreSQL |
| DB host | `localhost` |
| DB name | `lifesync` |
| DB user | `pattern` |
| Browser for automation | Google Chrome |
| Selenium mode | Headless by default, visible mode supported with `SELENIUM_HEADLESS=false` |

### Tooling

| Tool | Version / Notes |
|---|---|
| Node test runner | `node --test` via `npm test` |
| Frontend build | `vite build` |
| Python | Python 3.13 local runtime |
| Selenium | `selenium 4.43.0` |
| Chrome observed in run | `chrome=142.0.7444.176` |

## 4. Test Inputs

### Backend Unit Test Inputs

The backend unit test suite covers:

- Auth controller validation for missing required fields
- Duplicate e-mail registration checks
- Invalid login password handling
- Logout token blacklisting behavior
- Protected route token validation
- Malformed JWT rejection
- `ProfileBuilder` numeric range validation
- `ProfileBuilder` password and gender validation
- `SqlUpdateBuilder` field ordering and null handling
- Existing observer, prompt builder, validator, and DB integration scenarios already present in the repository

### Selenium Smoke Test Inputs

The automated Selenium flow used the following runtime-generated test data pattern:

| Input | Value |
|---|---|
| Email | `selenium_<random8>@example.com` |
| Password | `Test1234!` |
| First name | `Selenium` |
| Last name | `User<random4>` |
| Gender | `male` |
| Age | `27` |
| Height | `178` |
| Initial weight | `74` |
| Updated weight during profile edit | `76` |

### Commands Executed

```powershell
cd backend
npm test
```

```powershell
cd frontend
npm run build
```

```powershell
cd client
python selenium_e2e.py
```

## 5. Test Results

### Summary

| Test Set | Result |
|---|---|
| Backend unit tests | Passed |
| Frontend build validation | Passed |
| Selenium smoke test | Passed |

### Detailed Results

| Test Set | Measured Result | Outcome |
|---|---|---|
| Backend unit tests | `41/41` tests passed | Pass |
| Frontend build | Build completed successfully | Pass |
| Selenium smoke test | Registration, dashboard load, profile update, logout, and re-login completed successfully | Pass |

### Coverage Improvement Delivered In This Cycle

- Added auth middleware unit tests
- Added auth controller unit tests
- Expanded builder test cases for null and invalid numeric inputs
- Confirmed the existing backend suite still passes after additions
- Confirmed end-to-end UI smoke flow with Selenium

### Notes and Observations

- Backend test execution required the local environment because the sandbox blocked the Node test runner child process.
- Selenium ran successfully after making the UI more testable with stable `data-testid` selectors.
- Chrome UI may not appear unless `SELENIUM_HEADLESS=false` is set explicitly.

### Raw Backend Test Output

```text
npm test

> lifesync-backend@1.0.0 test
> node --test test/*.test.js

✔ register returns 400 when required fields are missing (80.4373ms)
✔ register returns 409 when email is already registered (1.0648ms)
✔ login returns 401 when password check fails (1.1167ms)
✔ logout blacklists the bearer token (1.0412ms)
✔ me returns 404 when user cannot be found (1.4245ms)
✔ auth middleware rejects requests without bearer token (2.6638ms)
✔ auth middleware rejects blacklisted tokens (3.6692ms)
✔ auth middleware rejects malformed tokens (0.5144ms)
✔ auth middleware attaches userId for valid tokens (3.0454ms)
✔ ProfileBuilder builds a sanitized profile payload (2.8525ms)
✔ ProfileBuilder ignores empty password input (0.2366ms)
✔ ProfileBuilder converts empty numeric and gender values to null (1.0692ms)
✔ ProfileBuilder rejects short passwords (0.7342ms)
✔ ProfileBuilder rejects password confirmation mismatches (0.5991ms)
✔ ProfileBuilder rejects out-of-range numbers and invalid genders (0.3276ms)
✔ ProfileBuilder accepts null password and preserves omitted fields (0.3251ms)
✔ ProfileBuilder rejects non-integer numeric inputs (0.2705ms)
✔ SqlUpdateBuilder accumulates fields and values in order (0.8424ms)
✔ SqlUpdateBuilder reports emptiness correctly (0.6099ms)
✔ SqlUpdateBuilder can build a WHERE clause without update fields (0.3613ms)
✔ SqlUpdateBuilder keeps null values in update order (0.2705ms)
[dotenv@17.3.1] injecting env (11) from .env -- tip: 🤖 agentic secret storage: https://dotenvx.com/as2
PostgreSQL connected successfully
[UserNotificationObserver] Updating notification for user 2a7b9d44-5563-4be5-8fbc-fc1c90324b1a
[UserNotificationObserver] Event data: {
  type: 'PlanCreated',
  title: 'Test Plan Created',
  message: 'Integration test notification',
  referenceId: null
}
✔ DB connection executes queries (66.7457ms)
[UserNotificationObserver] Notification created: {
  notification_id: '79c66ea4-6bc0-4fe0-ba9d-5176ea27da21',
  user_id: '2a7b9d44-5563-4be5-8fbc-fc1c90324b1a',
  type: 'PlanCreated',
  title: 'Test Plan Created',
  message: 'Integration test notification',
  reference_id: null,
  is_read: false,
  created_at: 2026-04-13T23:55:20.505Z,
  read_at: null
}
✔ UserNotificationObserver writes notification to DB (6.8575ms)
[Subject] Observer attached. Total observers: 1
[Subject] Notifying 1 observer(s)...
[Subject] Observer detached. Remaining observers: 0
[Subject] Observer attached. Total observers: 1
[PlanEventEmitter] Plan created event for user: 7
[Subject] Notifying 1 observer(s)...
[Subject] Observer attached. Total observers: 1
[PlanEventEmitter] Plan updated event for user: 2
[Subject] Notifying 1 observer(s)...
[PlanEventEmitter] Profile updated event for user: 2
[Subject] Notifying 1 observer(s)...
[PlanEventEmitter] Survey completed event for user: 2
[Subject] Notifying 1 observer(s)...
[PlanEventEmitter] Goal missed event for user: 2
[Subject] Notifying 1 observer(s)...
✔ Observer base class requires update to be implemented (1.8128ms)
✔ Subject attach avoids duplicates and detach removes observers (1.2906ms)
✔ Subject getState must be implemented by subclasses (0.2478ms)
✔ PlanEventEmitter emits plan created event to attached observers (1.756ms)
✔ PlanEventEmitter emits update and profile related notifications (2.6949ms)
✔ PlanEventEmitter capitalize handles mixed casing (0.2158ms)
✔ getPeriods returns expected labels for daily weekly and monthly durations (2.4113ms)
✔ diet prompt includes periods titles and restriction guidance (0.8398ms)
✔ diet prompt omits restriction rule when allergy info is absent (0.3154ms)
✔ exercise prompt includes exercise rows and serialized user context (0.4793ms)
✔ extractJSON parses raw JSON markdown fences and surrounding text (3.1749ms)
✔ validatePlanResponse normalizes row titles and trims extra rows/items (2.8028ms)
✔ validatePlanResponse pads missing rows and cycles existing items to fill periods (0.8175ms)
✔ validatePlanResponse sanitizes leaked personal information (0.3646ms)
✔ validatePlanResponse rejects payloads with too many empty cells (0.6426ms)
✔ validatePlanResponse rejects non-object or missing rows payloads (0.2056ms)
✔ parseAndValidatePlan runs extraction and normalization together (0.5778ms)
✔ parseAndValidatePlan returns a parse error for invalid JSON text (0.2784ms)
ℹ tests 41
ℹ suites 0
ℹ pass 41
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 358.0644
```

## 6. Deployment Diagram

### Mermaid Diagram

![Deployment Diagram](LifeSync/docs/diagrams/mermaid_diagram.png)

### Related Existing Diagram Asset

Existing deployment diagram in the repository:

![Deployment Diagram](LifeSync/docs/diagrams/deployment_diagram.png)

## 7. Conclusion

The current test cycle is **successful**. The backend unit test suite is green, the frontend builds successfully, and the Selenium smoke flow validates the main authentication and profile update path end-to-end. The project is in a good state for committing and sharing the latest test evidence.
