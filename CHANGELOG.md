# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.1.6](https://github.com/StanislavMakhrov/application/compare/v0.1.5...v0.1.6) (2026-03-26)


### Features

* add UI/UX Designer agent and update related documentation ([da00007](https://github.com/StanislavMakhrov/application/commit/da00007fece6ec279604d6a70d92f2d33f2cd755))
* company settings management, UI simplification, and invoice flexibility ([088bdf0](https://github.com/StanislavMakhrov/application/commit/088bdf0521dc56217865145afcb1cadb2bc7003d))


### Bug Fixes

* agents cannot create docs/features/NNN-*/ on copilot/* branches ([3040d4c](https://github.com/StanislavMakhrov/application/commit/3040d4c08e8f87da07472ee1aa68cad62f313650))
* correct E2E button count assertion for screen 2 (7 upload zones, not 3) ([eb94abb](https://github.com/StanislavMakhrov/application/commit/eb94abb12b5f5dc5f9a51a2b094ea5467c82a0e7))
* extract calculateTotal, add Screen6 UploadOCR, fix PATCH error handling ([1304c23](https://github.com/StanislavMakhrov/application/commit/1304c23c20057e8d2107ec12e26e757684414309))
* invoice upload UI bugs - remove monthly mode, add per-doc metadata, fix sum calculation ([6b76d20](https://github.com/StanislavMakhrov/application/commit/6b76d20233d99f0ba811c5683fe020120948d0e8))
* make Jahresabrechnung mutually exclusive per field zone ([dfde92b](https://github.com/StanislavMakhrov/application/commit/dfde92bbf71d17145b91bcc3298dd58b24d8a228))
* remove duplicate UploadOCR buttons alongside FieldDocumentZone ([425860a](https://github.com/StanislavMakhrov/application/commit/425860a4a9ddc7d137f28b38f17dba241aecf2f6))
* remove exception clause to enforce full orchestrator pipeline for issue assignments ([cbc9742](https://github.com/StanislavMakhrov/application/commit/cbc9742b1fd91aa2cfae56eae80f0bda805e3e51))
* rename invoice button label and fix duplicate button and wrong position ([6c761c1](https://github.com/StanislavMakhrov/application/commit/6c761c11fe13e97e5c063aed08ad7455e60a234c)), closes [#2](https://github.com/StanislavMakhrov/application/issues/2) [#3](https://github.com/StanislavMakhrov/application/issues/3)
* resolve code review blockers (path traversal, docs, merge conflicts) ([97b2a49](https://github.com/StanislavMakhrov/application/commit/97b2a49f2d0549743538ce59af374b8d84708648))
* restore OCR upload and fix annual invoice calculateTotal ([7cd3e00](https://github.com/StanislavMakhrov/application/commit/7cd3e0089c39015578d8369b8db54f91e6a29c4c))

## [0.1.5](https://github.com/StanislavMakhrov/application/compare/v0.1.4...v0.1.5) (2026-03-24)


### Features

* add full company profile section and always-visible boundaries in GHG report ([003221e](https://github.com/StanislavMakhrov/application/commit/003221ee58f12786dde7dc6557203a6a41b64415))
* add reporting boundaries and company profile setup ([282e395](https://github.com/StanislavMakhrov/application/commit/282e395f9ce6ca0ac31b6592654040679905b02b))


### Bug Fixes

* tighten exception clause for orchestrator session continuity in documentation ([ebbdbfe](https://github.com/StanislavMakhrov/application/commit/ebbdbfefffd3a300766e4949fd3c5e019e62d84a))

## [0.1.4](https://github.com/StanislavMakhrov/application/compare/v0.1.3...v0.1.4) (2026-03-24)


### Features

* add Add Year button to dashboard year selector ([28bba89](https://github.com/StanislavMakhrov/application/commit/28bba896b61c37cd31a4828a0cb962c77cbcad74))
* add Settings page with year management (add + delete) ([f10f459](https://github.com/StanislavMakhrov/application/commit/f10f45908e79f8b96222505bec96c0b1e341164d))


### Bug Fixes

* route [@copilot](https://github.com/copilot) issue assignments through Workflow Orchestrator ([824d334](https://github.com/StanislavMakhrov/application/commit/824d334dcf0464e3ed46641e103b65b2afad8729))

## [0.1.3](https://github.com/StanislavMakhrov/application/compare/v0.1.2...v0.1.3) (2026-03-24)


### Features

* modern design refresh with improved charts and styling ([b98ad3a](https://github.com/StanislavMakhrov/application/commit/b98ad3a437000aad6e0c6302601e69ed7137dcae))

## [0.1.2](https://github.com/StanislavMakhrov/application/compare/v0.1.1...v0.1.2) (2026-03-24)


### Features

* optimize Docker build speed with .dockerignore and remove unused deps stage ([09d8df3](https://github.com/StanislavMakhrov/application/commit/09d8df3eab5085631cd0aee562e8544078b2c394))


### Bug Fixes

* add mark-ready subcommand to pr-github.sh and mandate it in coding-agent-workflow skill ([50d395c](https://github.com/StanislavMakhrov/application/commit/50d395cd070c72fd15a79cb38447be7789c93d90))
* add permissions for contents and pull-requests in Copilot setup workflow ([5818f02](https://github.com/StanislavMakhrov/application/commit/5818f022c84039a659f06e6b99e61484068b9cdd))
* chmod 600 shell profiles after writing GH_TOKEN, improve docs clarity ([3812529](https://github.com/StanislavMakhrov/application/commit/381252905d667fb6299e979e5bc7e105c5639fcf))
* explicit empty check in pr-github.sh + mask COPILOT_TOKEN before env export ([0549446](https://github.com/StanislavMakhrov/application/commit/05494462d23e76e6cef1deade6d996c732f54f0d))
* export COPILOT_TOKEN to agent session via GITHUB_ENV ([6ba4db7](https://github.com/StanislavMakhrov/application/commit/6ba4db7294dc3ab1a03b1c8fc501ecdc23ee5f6a))
* expose RELEASE_TOKEN as GH_TOKEN in copilot-setup-steps for PR creation ([b197ce5](https://github.com/StanislavMakhrov/application/commit/b197ce5f8749b0b9ef8e3a658245e4b840498005))
* handle missing CHANGELOG.md gracefully and generate it in CI ([ab963c0](https://github.com/StanislavMakhrov/application/commit/ab963c0599f8f5783f9382313725a7bd4c3cb6c6))
* skip git push in pr-github.sh if branch already on remote ([6107706](https://github.com/StanislavMakhrov/application/commit/61077066bb254e8d2d90c8452da8cfa6dc84b2fa))
* use dedicated COPILOT_TOKEN secret instead of RELEASE_TOKEN for Copilot agent ([30eb6cf](https://github.com/StanislavMakhrov/application/commit/30eb6cf6f55f7976ba990e31c47a5debddf936ae))
* write GH_TOKEN to ~/.bashrc and ~/.profile so agent bash sessions inherit it ([8ee606f](https://github.com/StanislavMakhrov/application/commit/8ee606f1276b5413b2063b17d98591ed4efa3a95))
