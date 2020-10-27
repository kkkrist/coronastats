# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## <small>1.11.1 (2020-10-27)</small>

* fix(crawler): make lg crawler more flexible ([18352df](https://github.com/kkkrist/coronastats/commit/18352df))





## <small>1.10.4 (2020-10-23)</small>

* fix(crawler):use error handler to handle errors ([918b2a8](https://github.com/kkkrist/coronastats/commit/918b2a8))
* fix(crawler): add error handler w/ email cap ([3ef32cb](https://github.com/kkkrist/coronastats/commit/3ef32cb))
* fix(crawler): mail whole stack, don't run mailer if ERROR_EMAIL is undefined in error handler ([6a4f065](https://github.com/kkkrist/coronastats/commit/6a4f065))
* fix(crawler): support arrays of errors in error handler ([8cb63ff](https://github.com/kkkrist/coronastats/commit/8cb63ff))





## <small>1.10.3 (2020-10-22)</small>

* fix(crawler): fix "sl" crawler ([c10cdad](https://github.com/kkkrist/coronastats/commit/c10cdad))





## <small>1.10.2 (2020-10-22)</small>

* chore(crawler): clean-up "od" crawler ([f89bd68](https://github.com/kkkrist/coronastats/commit/f89bd68))





# [1.10.0](https://github.com/kkkrist/coronastats/compare/v1.9.1...v1.10.0) (2020-10-22)


### Bug Fixes

* **crawler:** improve regexes in "od" crawler ([a4cdc15](https://github.com/kkkrist/coronastats/commit/a4cdc15dd61b44c3b30ee2ac0f4aada7ad3b29a9))


### Features

* **crawler:** add crawler for "od" areacode ([d03c41e](https://github.com/kkkrist/coronastats/commit/d03c41e4259fed2faed285feffeef3af81f8747c))





# [1.9.0](https://github.com/kkkrist/coronastats/compare/v1.8.3...v1.9.0) (2020-10-21)


### Features

* **crawler:** add crawler for "lg" areacode ([f312ff4](https://github.com/kkkrist/coronastats/commit/f312ff45e88e9e9e02427a26107ef41306a4cb05))





## [1.6.6](https://github.com/kkkrist/coronastats/compare/v1.6.5...v1.6.6) (2020-10-16)


### Bug Fixes

* **crawler:** fix "sl" crawler, provide more detailed error messages ([8e06cce](https://github.com/kkkrist/coronastats/commit/8e06ccef516c12844cfd01f8f9f66dd87e395323))





## [1.6.5](https://github.com/kkkrist/coronastats/compare/v1.6.4...v1.6.5) (2020-10-15)


### Bug Fixes

* **crawler:** don't even run bulk insert if input does not contain any updated or new records at all ([6957f47](https://github.com/kkkrist/coronastats/commit/6957f474fd79855ae6506780a4d4fb353024836b))





## [1.6.4](https://github.com/kkkrist/coronastats/compare/v1.6.3...v1.6.4) (2020-10-15)


### Bug Fixes

* **crawler:** fix "sl" areacode crawler ([f465491](https://github.com/kkkrist/coronastats/commit/f465491e34d00677c412e1d3efdc5194d8e7c536))





# [1.6.0](https://github.com/kkkrist/coronastats/compare/v1.5.0...v1.6.0) (2020-10-11)


### Features

* **crawler:** add crawler for "plö" areacode ([5dc93a1](https://github.com/kkkrist/coronastats/commit/5dc93a181a10969ea7ed0583b7ab822b9b1e5ae5))
* **crawler:** also grab 7-day incidence value in "plö" crawler ([753f2c9](https://github.com/kkkrist/coronastats/commit/753f2c97fc7a233168bf3ce2cb7c9fed26727504))
* **crawler:** only upsert records with actually have changed ([aeffa96](https://github.com/kkkrist/coronastats/commit/aeffa967ca6a0b1d410457034b744a40d3e098b9))
* **crawler:** wrap crawler calls into `Promise.allSettled` instead of `Promise.all` to let crawlers fail gracefully ([feeb2ab](https://github.com/kkkrist/coronastats/commit/feeb2ab352b4a7b897dc79130f816bf9b1c54048))





# [1.5.0](https://github.com/kkkrist/coronastats-fl/compare/v1.4.0...v1.5.0) (2020-10-07)


### Features

* use couchdb as backend/api ([#2](https://github.com/kkkrist/coronastats-fl/issues/2)) ([d2b4459](https://github.com/kkkrist/coronastats-fl/commit/d2b4459d309bc26e74d3f1339e904b54f9a87552))





# [1.4.0](https://github.com/kkkrist/coronastats-fl/compare/v1.3.2...v1.4.0) (2020-10-01)


### Bug Fixes

* **crawler:** account for same-day updates notation in "fl" crawler ([5f8207c](https://github.com/kkkrist/coronastats-fl/commit/5f8207c479176138f9eebbb9b42fea846c9b7dc2))
* **crawler:** handle crawlers independently ([665b06a](https://github.com/kkkrist/coronastats-fl/commit/665b06a1d71e60e2501573df96d725fdfe4996cf))
* **crawler:** match case-insensitive in "rz" crawler ([238bfbf](https://github.com/kkkrist/coronastats-fl/commit/238bfbf9b560810e2fb45ac93b18787a468c0dc9))


### Features

* **crawler:** add crawler for "sl" collection ([3953fd1](https://github.com/kkkrist/coronastats-fl/commit/3953fd1953d388f3ed811423f93933b0c0ae7a9f))





# [1.3.0](https://github.com/kkkrist/coronastats-fl/compare/v1.2.0...v1.3.0) (2020-09-30)


### Features

* **crawler:** turn into multi-crawler framework, add crawler for "rz" ([fe8720f](https://github.com/kkkrist/coronastats-fl/commit/fe8720f6859995349d2c3be4b7ff3fe084d0860b))





# [1.2.0](https://github.com/kkkrist/coronastats-fl/compare/v1.1.4...v1.2.0) (2020-09-29)


### Features

* add dedicated api service ([#1](https://github.com/kkkrist/coronastats-fl/issues/1)) ([2242b9a](https://github.com/kkkrist/coronastats-fl/commit/2242b9afa154941026a59423c38a3fb9a3c5ac62))





## [1.1.4](https://github.com/kkkrist/coronastats-fl/compare/v1.1.3...v1.1.4) (2020-09-28)


### Bug Fixes

* **crawler:** consider (optional) asterisks in metrics notation ([d687d6a](https://github.com/kkkrist/coronastats-fl/commit/d687d6accc5b083f863ac093c82d4f4ee7dab510))





## [1.1.3](https://github.com/kkkrist/coronastats-fl/compare/v1.1.2...v1.1.3) (2020-09-26)


### Bug Fixes

* **crawler:** traverse backwards through DOM hierarchy until date h2 is found ([65e5d74](https://github.com/kkkrist/coronastats-fl/commit/65e5d746243157d6ca522295ca0ef91aea135ef3))
* **crawler:** update .gitignore ([ec742d5](https://github.com/kkkrist/coronastats-fl/commit/ec742d53f66f72ae52f26d9c19da1c003dc3f2fb))





## 1.1.1 (2020-09-14)

**Note:** Version bump only for package coronastats-fl-crawler
