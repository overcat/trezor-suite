# 0.2.7

-   npm-prerelease: @trezor/connect-common 0.2.7-beta.1 (d876bc6071)
-   Revert chore(connect-common): add fw 2.8.6. for t3t1 (064c56a642)
-   chore(connect-common): add fw 2.8.6. for t3t1 (21b4b9b0a3)

# 0.2.6

-   fix(connect-common): update ripple default backends (6a3dbf2b77)

# 0.2.5

-   npm-prerelease: @trezor/connect-common 0.2.5-beta.1 (6314de0dad)

# 0.2.4

-   npm-prerelease: @trezor/connect-common 0.2.4-beta.1 (55487acb49)
-   fix(connect): preferred device handling based on state (58b854cbed)

# 0.2.3

-   npm-prerelease: @trezor/connect-common 0.2.3-beta.2 (5038b5bbd4)
-   chore: get rid of '@typescript-eslint/no-unused-vars': 'off', and enforce it everywhere (1ad7b6f9b1)
-   chore: enforce @typescript-eslint/no-restricted-imports everywhere (5d1104bfeb)
-   chore: add 'import/no-duplicates' ESLint rule (8d8beba862)
-   feat(connect): add t3w1 releases.json (01cdee48f1)
-   refactor(connect): separate unique and transport device path (0f8d233d56)
-   npm-prerelease: @trezor/connect-common 0.2.3-beta.1 (412da596f1)
-   chore: update backends for bsc and op (458f0fe3d9)
-   feat(connect): add Optimism (c2fb244649)

# 0.2.1

-   npm-prerelease: @trezor/connect-common 0.2.1-beta.1 (4dc0af2640)
-   chore(connect-common): change lng blob in release.json (c8a0c46067)
-   chore(connect-common): add FW 2.8.3 binaries for T3B1 (c32984c54e)
-   chore(connect-common): add FW 2.8.3 binaries for T3T1 (b57198acf7)
-   feat: add filterCoins script, update coins (74c53f68ee)
-   chore(connect-common): update coins.json via yarn update-coins (f7c16e1e34)
-   chore(connect-common): add t3b1 to coins.json (6a8b460250)

# 0.2.0

-   npm-prerelease: @trezor/connect-common 0.1.1-beta.3 (2bf4c38c95)
-   feat(connect-common): Generalize firmware-check script for all devices, backfill revisionIds into releases (655b9d3574)
-   chore(connect-common): add fw 2.8.1 (847cfd6a1d)
-   chore(connect): rename bsc to bnb as it is declared in fw repo (0174dc2f38)
-   feat(connect-common): adding revisions into releases.json & adding a script to check their correctness (fcc68d281c)
-   npm-prerelease: @trezor/connect-common 0.1.1-beta.2 (c9bf01cb8a)
-   chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
-   npm-prerelease: @trezor/connect-common 0.1.1-beta.1 (fe9453ed05)
-   chore(connect-common): fw version 1.9.0 and 2.3.0 required (ee623e4090)
-   feat(suite): add support for Bitcoin Only changelog + add Markdown support for all changelogs (a707883081)
-   chore(connect-common): added fw 2.8.0 changelog (8accbc4ab3)
-   chore: add T3T1 fw binaries to lfs (abaff39c54)
-   chore(connect-common): add new fw 2.8.0 (314052b56a)

# 0.0.34-beta.1

-   chore(connect-common): edit firmware changelogs (3637a56cf7)
-   fix(connect-common): firmware release url (0166df50e6)
-   chore(connect-common): update firmware binaries to 2.7.2 (63923287e8)
-   chore(connect-common): T3T1 support (9d0adae993)

# 0.0.33-beta.1

-   chore(connect): bump required fw to 1.8.1/2.1.0 (2f14ff6703)
-   chore(connect-common): fix bootloader_version in the first t3t1 record (6ebae70094)

# 0.0.32

-   feat(connect): add T3T1 releases.json (a9840087c8)
-   chore: remove min_bridge_version from releases.json (c384914903)
-   chore(connect-common): add Czech to available FW translations (4a1aa824c6)

# 0.0.31

-   fix(connect): webextension save sessions (efed18e4ea)
-   chore(suite): remove goerli (8eb6b271a5)
-   chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
-   chore(connect-common): add firmware binaries 2.7.0 (4c14b45bd6)
-   chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 0.0.30

-   fix(connect): fix build of connect-web (50f35cb2a)

# 0.0.29

-   fix: from g:tsx to local tsx in prepublish script (d21d698b2)
-   fix(connect-common): remove confusing log in AbstractMessageChannel (6d3b60c73)
-   chore(repo): remove build:lib for some simple packages (#11276) (7febd10cf)
-   chore(suite): autofix newlines (c82455e74)
-   chore(utils): remove build step requirement from @trezor/utils (#11176) (6cd3d3c81)
-   fix(connect-web): workaround to work with older content-script (5da505b02)
-   fix(connect-web): reconnect message channel (ee98bb51c)
-   chore(connect-web): refactor popupmanager (af1723e4f)
-   chore: use global tsx (c21d81f66)
-   chore: update typescript and use global tsc (84bc9b8bd)
-   chore: use global rimraf (5a6759eff)
-   chore: use global jest (a7e68797d)
-   chore: upgrade jest to 29.7.0 (3c656dc0b)
-   chore: upgrade jest (004938e24)
-   chore: update root dependencies (fac6d99ec)

# 0.0.28

-   feat(suite): Rename Polygon to Polygon PoS (15a7fd38dc)
-   feat(suite): add Polygon (8c569ca580)
-   chore(connect-common): remove es5 target (fails with TypedEmitter) (0a19580f63)
-   feat(connect-common): store is event emitter, saves permissions and preferred device (db0e9631da)

# 0.0.27

-   feat(connect-common): message channel to allow lazy handshake (79be923e67)

# 0.0.26

-   feat(connect-common): add resolve messages promises to abstract (f9e6f304f)
-   fix(connect-common): when init always create new deferred (70c6c0048)

# 0.0.24

-   feat(connect-common): add more backend urls for solana (29f042470)
-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
-   chore: update `jest` and related dependency (b8a321c83)
-   chore(connect-common): update fw binaries to 2.6.4 (398509788)
-   chore(repo): update tsx (53de3e3a8)
-   feat(suite): add Solana support (f2a89b34f)
-   chore(suite): unify support config for eth coins (8776bb79c)
-   chore(suite): add Holesky (175707861)
-   chore(connect-webextension): postMessage useQueue param (4e626e758)

# 0.0.23

-   feat(connect): update solana backend urls (876f60939)
-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   chore(jest): update in connect-common package (5801d2595)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   chore(tests): cleanup jets configs (#9869) (7b68bab05)
-   feat(deps): update deps without breaking changes (7e0584c51)
-   feat(connect-common): add T2T1 & T2B1 firmware binaries 2.6.3 bootloader 2.1.4 (9cca8b14f)
-   chore(desktop): update deps related to desktop packages (af412cfb5)

# 0.0.22

-   chore(connect): update coins.json support format (95f270fec)
-   fix(connect-common): fix bootloader version in T2B1 release config (4e698091b)
-   feat(suite): support t2b1 firmware installation (9ef2bf627)
-   chore(connect): fix local storage check (#9547) (b9ac84446)

# 0.0.19

-   chore(connect): update coins.json (trezor-common f2374ae) (3b21c4308)
-   chore(connect-\*): change model to internal model (8edb0a59d)
-   feat(suite): add Sepolia (bc2236c1c)
-   fix(connect-common): put back goerli and etc records for suite/blockchain-link (23783a3ef)
-   chore(connect): remove unused rskip60 field from coininfo (e686e143c)
-   chore(connect): update coins.json (ebcb36d75)

# 0.0.17

-   chore: forgotten renaming to T1/TT (5decd0839)
-   chore: unify trezor names in docs/comments (74290aab3)

# 0.0.15

-   a926901a6 chore: unify T1 and TT names
-   211ac5ef3 chore(coins.json): remove old eth testnets

# 0.0.14

-   chore(connect): move systemInfo to connect-common

# 0.0.13

-   2.6.0 FW

# 0.0.12

-   feat: cardano preview testnet

# 0.0.11

-   refactor storage
    -   `storage.load(key)` -> `storage.load().key`
    -   `storage.save(key, value)` -> `storage.save(state => ({ ...state, key: value }))`
-   versioning of storage

# 0.0.10

### Added

-   2.5.3 FW

### Removed

-   2.5.2 FW

# 0.0.9

### Added

-   1.11.2 & 2.5.2

# 0.0.6

### Added

-   1.11.1 & 2.5.1 FW, (1.11.0 BL)
-   [storage utils](./src/storage) moved from standalone Connect repository
-   [coins.json](./files/coins.json) moved from standalone Connect repository

### Removed

-   1.11.0 & 2.5.0 FW

# 0.0.5

### Added

-   1.11.0 & 2.5.0 FW

# 0.0.4

### Added

-   1.10.5 FW
