# Quality assurance and SonarQube

The quality pipeline is intentionally layered:

- ESLint statically checks every tracked application source file.
- Unit tests cover pure business logic in `src/lib` and must produce at least 80% LCOV line coverage.
- Integration tests exercise API route handlers against an isolated PostgreSQL database.
- BDD and E2E tests exercise browser pages and components. Their Playwright output is not LCOV, so `src/app/**` and `src/components/**` are excluded only from SonarQube's LCOV coverage denominator; they are still included in SonarQube static analysis.

Run the local checks after PostgreSQL for `simag_bmkg_test` is available:

```powershell
npm run lint
npm run test:unit
npm run test:integration
npm run test:coverage:lcov
npm run test:coverage:verify
npm run sonar:scan
```

`npm run sonar:quality` runs lint, coverage generation, the 80% core-coverage gate, and the SonarQube scan in that order. `sonar:scan` waits up to five minutes for the server-side Quality Gate, so Reliability, Maintainability, Security, and coverage failures are returned to the terminal/CI.

For GitHub Actions, configure `SONAR_HOST_URL` and `SONAR_TOKEN` repository secrets. The configured server must be reachable from the GitHub runner; a SonarQube server bound to `127.0.0.1` is reachable only from a self-hosted runner on that machine.
