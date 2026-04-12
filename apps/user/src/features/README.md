# User App Feature Structure

`src/app` owns routing, layouts, loading states, and API entry points.

Feature implementation code lives here:

- `discover`: Discover page content.
- `home`: single dashboard, market preview, and dashboard data.
- `profile`: profile menu and editable profile/withdrawal forms.
- `trade`: trade page client and server snapshot builder.
- `wallet`: wallet page, release history, and wallet-specific UI.

Shared shell, navigation, and icons stay in `src/components`.
Cross-feature utilities such as auth, cash summary, receipts, and reward math stay in `src/lib`.
