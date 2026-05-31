# Windows Release Checklist

Assetly Financial Manager ships on Windows as an NSIS `.exe` installer. Public releases should be Authenticode-signed before broad promotion so Windows and SmartScreen trust prompts are less severe.

## Azure Artifact Signing

Windows signing is configured through Azure Artifact Signing / Trusted Signing in `package.json`.

- Resource group: `rg-assetly-signing-2`
- Account name: `assetlysigning2`
- Account endpoint: `https://eus.codesigning.azure.net/`
- Certificate profile: `assetlyprod`
- Publisher subject: `CN=Cornell Schultz, O=Cornell Schultz, L=Thompsons Station, S=tn, C=US`

The build uses electron-builder `win.azureSignOptions`, so do not configure `win.signtoolOptions` at the same time.

## Required Build Env Vars

The signing identity must have the `Artifact Signing Certificate Profile Signer` role on the Artifact Signing account or certificate profile.

For service-principal signing, set:

- `AZURE_TENANT_ID`: Microsoft Entra tenant/directory ID.
- `AZURE_CLIENT_ID`: app registration/client ID for the signing app.
- `AZURE_CLIENT_SECRET`: client secret for that app registration.

Do not commit these values.

## Build Commands

```bash
npm run electron:win:pack
npm run electron:win
```

- `electron:win:pack` creates an unpacked Windows app for debugging.
- `electron:win` creates `release/Assetly-Financial-Manager-Setup-<version>.exe`.
- The installer supports silent install with `/S` for Microsoft Partner Center.
- Upload the installer with `npm run upload:assetly-installer -- windows`.

## Partner Center Values

- Product name: `Assetly Financial Manager`
- Package type: `EXE`
- Installer parameters: `/S`
- Download URL format: `https://assetlymanager.online/checkout/start?platform=windows`

For Partner Center submissions, prefer an immutable direct artifact URL for each version. The website checkout route is for customer purchases.
