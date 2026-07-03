---
name: App branding — Fresh Tarkari
description: App rebranded from KrishiBazar to Fresh Tarkari; where logo and name appear.
---

## Rule
The app is named "Fresh Tarkari" (previously KrishiBazar). All user-facing name references use `t('app.name')` from i18n so both EN and NP display correctly.

**Logo:** `artifacts/krishibazar/public/logo.png` — referenced as `/logo.png` in all layouts.

**Where name/logo appear:**
- `AuthLayout.tsx` — hero section logo image + `t('app.name')`
- `FarmerLayout.tsx` — top nav logo image + `t('app.name')`
- `WholesalerLayout.tsx` — top nav logo image + `t('app.name')`
- `AdminLayout.tsx` — sidebar logo image + `t('app.name')`
- `DashboardPage.tsx` — header logo image + `t('app.name')`
- `App.tsx` loading screen — hardcoded "Fresh Tarkari" (i18n not loaded yet)
- `index.html` — `<title>`, meta tags all updated
- `vite.config.ts` — PWA manifest `name` and `short_name`
- `i18n/en.json` + `i18n/np.json` — `app.name` key

**Why:** `App.tsx` loading screen renders before i18n initializes, so it must be hardcoded.
