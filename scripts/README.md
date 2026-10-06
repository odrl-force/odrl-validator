# Shape and Rule bundling scripts

This folder contains **build support scripts** that package the project’s **SHACL shapes** and **Notation3 (N3) rules** into TypeScript modules, so the evaluator can ship with **known-good, versioned defaults** and run in environments where reading files at runtime is inconvenient (e.g., browser bundles, serverless, strict deployments).

> [!NOTE]
> The generated files are overwritten on every run. Edit the `.ttl` or `.n3` sources and rerun the script instead of editing the `.ts` files.

### `config.json`

Declares **which** SHACL shape files and **which** N3 rule files are considered the active set for bundling.

*   You edit this when you want to change the “default” shapes/rules that get packaged.
*   
NOTE: The rules and shapes are expected to be in either the [shapes](../src/shapes/) or [rules](../src/rules/) directory

### `makeShapes.ts`

Creates the **TypeScript shape bundle** from the configured SHACL shape files.

*   Purpose: ensure the project can import the shapes as a constant (instead of reading `.ttl` files at runtime).
*   Outcome: updates/creates a TS file under the shapes location used by the rest of the repo.

### `makeRules.ts`

Creates the **TypeScript rules bundle** from the configured Notation3 rule files.

*   Purpose: ensure the evaluator/engine can import the rules as a constant (instead of reading `.n3` files at runtime).
*   Outcome: updates/creates a TS file under the rules location used by the rest of the repo.

### `makeProfiles.ts`

Creates the **TypeScript profile bundles** from the [ODRL profiles](https://www.w3.org/TR/odrl-model/#profile-mechanism) shipped with the project (currently DPV and TOSL).

*   Purpose: ensure the validator can import the profiles as constants (instead of reading `.ttl` files at runtime), so they can be applied to the shapes with `addProfileToShape`.
*   Input: the Turtle sources in [profiles/source](../src/profiles/source/) (`dpv-odrl.ttl`, `tosl.ttl`). Unlike shapes and rules, the profiles are not listed in `config.json`; they are listed in the script itself.
*   Outcome: updates/creates one TS file per profile under [profiles](../src/profiles/), exporting the Turtle as a string constant (`DPV_PROFILE` in `DpvProfile.ts`, `TOSL_PROFILE` in `ToslProfile.ts`).


