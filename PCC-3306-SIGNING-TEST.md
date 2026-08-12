# PCC-3306 signing validation (THROWAWAY)

Throwaway file to validate the "require signed commits" branch protection on `main`.
This commit is intentionally created **unsigned** (`git commit --no-gpg-sign`) to
confirm GitHub reports it as "Unverified" and that it cannot land on `main`.

Safe to delete. Do NOT merge this PR.
