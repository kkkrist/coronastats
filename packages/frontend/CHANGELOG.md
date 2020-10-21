# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.9.1](https://github.com/kkkrist/coronastats/compare/v1.9.0...v1.9.1) (2020-10-21)


### Bug Fixes

* **frontend:** refactor 7d incidence calc ([817bdaf](https://github.com/kkkrist/coronastats/commit/817bdaf1a6e169b0a56055265bfcc44388c5fea8))





# [1.9.0](https://github.com/kkkrist/coronastats/compare/v1.8.3...v1.9.0) (2020-10-21)


### Bug Fixes

* **frontend:** move all of chart config to chart config module ([96e1354](https://github.com/kkkrist/coronastats/commit/96e1354b98ab295bc442e7e35522356efb9ffc57))


### Features

* **frontend:** add "lg", "plö" areacodes ([c04e7c3](https://github.com/kkkrist/coronastats/commit/c04e7c3310263a74ad65bf6f2f19772c7f658b25))





## [1.8.3](https://github.com/kkkrist/coronastats/compare/v1.8.2...v1.8.3) (2020-10-20)


### Bug Fixes

* **frontend:** always display notification if app boots while offline ([51d3c0e](https://github.com/kkkrist/coronastats/commit/51d3c0ef48ed9d4389acb36ae0e8eda318c63bd7))





## [1.8.2](https://github.com/kkkrist/coronastats/compare/v1.8.1...v1.8.2) (2020-10-20)


### Bug Fixes

* **frontend:** don't wait for "load" event to register service worker (somehow wouldn't trigger in Safari) ([ab8a29c](https://github.com/kkkrist/coronastats/commit/ab8a29c1b50ba32c597b6eeb8101ed189523d361))
* **frontend:** fix html meta tags ([cca56a4](https://github.com/kkkrist/coronastats/commit/cca56a406db0576b841bc38309c65e6a5278add1))





## [1.8.1](https://github.com/kkkrist/coronastats/compare/v1.8.0...v1.8.1) (2020-10-20)


### Bug Fixes

* **frontend:** don't cancel replication on unmount ([fb6c6df](https://github.com/kkkrist/coronastats/commit/fb6c6df23db679f76c07322172ac96cc5793b965))





# [1.8.0](https://github.com/kkkrist/coronastats/compare/v1.7.0...v1.8.0) (2020-10-20)


### Features

* add a service worker ([#4](https://github.com/kkkrist/coronastats/issues/4)) ([4c2cc07](https://github.com/kkkrist/coronastats/commit/4c2cc071a03c7f52664dad9203641be6ea0f17d3))





# [1.7.0](https://github.com/kkkrist/coronastats/compare/v1.6.7...v1.7.0) (2020-10-19)


### Bug Fixes

* **frontend:** go back to including current day in 7d incidence ([4a65e02](https://github.com/kkkrist/coronastats/commit/4a65e02e2c6f3424ab4a564f87a4684586d49d63))


### Features

* use pouchdb on top of couchdb as backend/api ([#3](https://github.com/kkkrist/coronastats/issues/3)) ([6765930](https://github.com/kkkrist/coronastats/commit/676593029256e35a61ef064d128f67dbd6ce8d64))





## [1.6.7](https://github.com/kkkrist/coronastats/compare/v1.6.6...v1.6.7) (2020-10-16)


### Bug Fixes

* **frontend:** fetch data from "areacode" view ([666b130](https://github.com/kkkrist/coronastats/commit/666b130193f207fb07e21faf03a6f1bf4629f2e3))





## [1.6.4](https://github.com/kkkrist/coronastats/compare/v1.6.3...v1.6.4) (2020-10-15)


### Bug Fixes

* **frontend:** Always use Statistikamt Nord's population numbers ([f52e6e6](https://github.com/kkkrist/coronastats/commit/f52e6e6545f1cdd8fa5845570a23a2af349f51d1))
* **frontend:** handle areacode url param front to back ([c73ff5f](https://github.com/kkkrist/coronastats/commit/c73ff5fe3e071329044adbe19bcd8624a0441f92))
* **frontend:** tweak marker positions ([4ed002a](https://github.com/kkkrist/coronastats/commit/4ed002ac5377c6d8c661de9384920f05821cc13a))





## [1.6.3](https://github.com/kkkrist/coronastats/compare/v1.6.2...v1.6.3) (2020-10-14)


### Bug Fixes

* **frontend:** use same 7-day incidence function as city administration does ([721058a](https://github.com/kkkrist/coronastats/commit/721058ae1b5e508dfc54921c933c745c31b5706a))


### Features

* **frontend:** add marker for autumn holiday start, tweak marker placement ([390cd6b](https://github.com/kkkrist/coronastats/commit/390cd6b040bca1d2c304dc1292151bbb9f417c30))





## [1.6.2](https://github.com/kkkrist/coronastats/compare/v1.6.1...v1.6.2) (2020-10-11)


### Bug Fixes

* **frontend:** only max out select width on small screens ([0bcd259](https://github.com/kkkrist/coronastats/commit/0bcd25922b1d93bc49906affd25f3698907babbd))





## [1.6.1](https://github.com/kkkrist/coronastats/compare/v1.6.0...v1.6.1) (2020-10-11)


### Bug Fixes

* **frontend:** fix repo name ([605c2a3](https://github.com/kkkrist/coronastats/commit/605c2a31c186eaefc2c87ae96d5725c41fe0d909))
* **frontend:** fix select width ([1c0511f](https://github.com/kkkrist/coronastats/commit/1c0511f478da2d5c490cd2b3578a078541e57910))





# [1.6.0](https://github.com/kkkrist/coronastats/compare/v1.5.0...v1.6.0) (2020-10-11)


### Features

* **frontend:** add multi-district capabilities, add "Kreis Schleswig-Flensburg and "Kreis Herzogtum Lauenburg" next to "Flensburg" ([842ce8a](https://github.com/kkkrist/coronastats/commit/842ce8a07f3c34143692bbce6638d022a4b2546a))





# [1.5.0](https://github.com/kkkrist/coronastats-fl/compare/v1.4.0...v1.5.0) (2020-10-07)


### Features

* use couchdb as backend/api ([#2](https://github.com/kkkrist/coronastats-fl/issues/2)) ([d2b4459](https://github.com/kkkrist/coronastats-fl/commit/d2b4459d309bc26e74d3f1339e904b54f9a87552))





# [1.4.0](https://github.com/kkkrist/coronastats-fl/compare/v1.3.2...v1.4.0) (2020-10-01)


### Bug Fixes

* **frontend:** add an asterisk to link 7-day incidence desc ([4c36fe0](https://github.com/kkkrist/coronastats-fl/commit/4c36fe02a9a36280ea5c89daba0c716e120bece1))
* **frontend:** fix legend props ([6d2c169](https://github.com/kkkrist/coronastats-fl/commit/6d2c1697c84131252d10068548d4f5ecded5e82c))


### Features

* **frontend:** show last modified timestamp in desc ([8d4195f](https://github.com/kkkrist/coronastats-fl/commit/8d4195f59386fea687855889dfcc351931557e6d))





# [1.2.0](https://github.com/kkkrist/coronastats-fl/compare/v1.1.4...v1.2.0) (2020-09-29)


### Features

* add dedicated api service ([#1](https://github.com/kkkrist/coronastats-fl/issues/1)) ([2242b9a](https://github.com/kkkrist/coronastats-fl/commit/2242b9afa154941026a59423c38a3fb9a3c5ac62))





## [1.1.3](https://github.com/kkkrist/coronastats-fl/compare/v1.1.2...v1.1.3) (2020-09-26)


### Bug Fixes

* **App:** re-phrase 7-day incidence description ([39a9eed](https://github.com/kkkrist/coronastats-fl/commit/39a9eed0cce4ae03d7616524dc38b56961e4ba49))





## [1.1.2](https://github.com/kkkrist/coronastats-fl/compare/v1.1.1...v1.1.2) (2020-09-25)


### Bug Fixes

* add 7-day incidence description ([a41f614](https://github.com/kkkrist/coronastats-fl/commit/a41f614b266cc8cb6f9b7e3237a43cf691e0240a))





## 1.1.1 (2020-09-14)


### Bug Fixes

* **frontend/App:** tweak legend ([35aaf3b](https://github.com/kkkrist/coronastats-fl/commit/35aaf3b18f53ea5b1edb471af6a8da03a684a9ed))
