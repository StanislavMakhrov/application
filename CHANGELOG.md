# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

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
