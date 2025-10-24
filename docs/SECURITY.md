# Security Policy

## Known Security Issues

### bigint-buffer Vulnerability (GHSA-3gc7-fjrx-p6mg)

**Status:** No patch available
**Severity:** High
**Affected Versions:** bigint-buffer <= 1.1.5
**Issue:** Buffer Overflow in toBigIntLE() function

This vulnerability exists in a transitive dependency chain:
```
@bonfida/spl-name-service
  └─ @solana/spl-token
      └─ @solana/buffer-layout-utils
          └─ bigint-buffer (vulnerable)
```

**Mitigation:**
- We have pinned bigint-buffer to version 1.1.5 via npm overrides
- This library does not directly use the vulnerable toBigIntLE() function
- The Solana community is aware of this issue and is working on a fix
- We will update to a patched version as soon as it becomes available

**Risk Assessment:**
- **Low risk** for this package as we don't directly invoke the vulnerable function
- The vulnerability could only be exploited if malicious input is passed to the toBigIntLE() function
- Our usage of Solana libraries is limited to blockchain operations with validated inputs

## Reporting a Vulnerability

If you discover a security vulnerability in this package, please report it by:

1. **Do not** open a public GitHub issue
2. Email the maintainers directly
3. Provide detailed information about the vulnerability
4. Allow reasonable time for a fix before public disclosure

We will acknowledge receipt within 48 hours and provide a timeline for resolution.

## Security Updates

We regularly monitor security advisories and update dependencies when patches become available. Security updates are prioritized and released as soon as possible.

To check for security updates:
```bash
npm audit
npm outdated
```

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |
| < 3.0   | :x:                |

## Dependencies

We maintain up-to-date dependencies and use:
- npm overrides for known vulnerable packages when no patch is available
- Automated dependency updates via Dependabot
- Regular security audits in CI/CD pipeline
