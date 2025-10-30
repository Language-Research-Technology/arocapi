## [1.2.0](https://github.com/Language-Research-Technology/arocapi/compare/v1.1.0...v1.2.0) (2025-10-30)

### Features

* add development server with file handler and Oni UI integration ([0dba3e4](https://github.com/Language-Research-Technology/arocapi/commit/0dba3e4e6efb0cc8ee848e1f41d85d4dc246e868))
* add entity transformer system ([7c639de](https://github.com/Language-Research-Technology/arocapi/commit/7c639dec3e2d42cc211f5d2a49b64c8444239a58))
* add file and RO-Crate handler system with streaming support ([cffe023](https://github.com/Language-Research-Technology/arocapi/commit/cffe0239029cec06d4fb9fdee29e53b1e22a8561))
* add support for File entity type ([edab2bb](https://github.com/Language-Research-Technology/arocapi/commit/edab2bb90395562529b3a574ca6c999267394964))
* add tests ([dde7485](https://github.com/Language-Research-Technology/arocapi/commit/dde748553da3486f6e8d3216616511ac05ab6a0c))
* create dummy data for development ([747c774](https://github.com/Language-Research-Technology/arocapi/commit/747c774b1de9cc9bb857bdeefe4210d065dd2ef8))
* refactor in line with latest API changes ([7bc19d8](https://github.com/Language-Research-Technology/arocapi/commit/7bc19d8e6a379715874fb12549e13ccd72f28163))
* switch entityType to a string so we don't restrict upstream types ([24b9e72](https://github.com/Language-Research-Technology/arocapi/commit/24b9e72d7a437248fc043a87fec4dc570e1d6ec2))

### Bug Fixes

* add migration for entityType ([56c1dc5](https://github.com/Language-Research-Technology/arocapi/commit/56c1dc538b15beae3600e05091a1d755f5138750))
* broken types from test additions ([e12d7a0](https://github.com/Language-Research-Technology/arocapi/commit/e12d7a0242b241436bf4da69cead8bfaa9bcbcd7))
* fixes after testing against oni ([32b1b87](https://github.com/Language-Research-Technology/arocapi/commit/32b1b87a7a3b183f738e48f47e510f6d9b67e21a))
* issues picked up in review ([f0587b1](https://github.com/Language-Research-Technology/arocapi/commit/f0587b1a7ddf51021e759bbfc504af26a0ca1fed))
* make changes for upcoming prisma v7 ([bfce95a](https://github.com/Language-Research-Technology/arocapi/commit/bfce95a84df6776195306b3d7e70987da9d710ee))
* recordType is now a scalar ([8b064cc](https://github.com/Language-Research-Technology/arocapi/commit/8b064ccc738724ae5dca4598449704c23ea98cb0))
* vite 4 uses esbuild and needs v8 ignore comments preserved ([29de4ad](https://github.com/Language-Research-Technology/arocapi/commit/29de4ad30ea4bc1d16a0fa4634e7be49c2a6deef))
* vite4 has better coverage detection - fill in the blanks ([8f3829e](https://github.com/Language-Research-Technology/arocapi/commit/8f3829e63bcf92bd82caf394afe06e6db39b3706))

## [1.1.0](https://github.com/Language-Research-Technology/arocapi/compare/v1.0.5...v1.1.0) (2025-08-27)

### Features

* make the API mountable ([edf1c24](https://github.com/Language-Research-Technology/arocapi/commit/edf1c24952a1e11f39ffd2c0ca1d63365333b32c))

### Bug Fixes

* finalise move to prisma multi-model ([0681330](https://github.com/Language-Research-Technology/arocapi/commit/0681330bc51508dccbb4fb2258e2dc17b411a641))

## [1.0.5](https://github.com/Language-Research-Technology/arocapi/compare/v1.0.4...v1.0.5) (2025-08-26)

### Bug Fixes

* migrate to per file prisma models ([c9cad6c](https://github.com/Language-Research-Technology/arocapi/commit/c9cad6cec4d1a49e6c9833643fee22fe25d8396f))

## [1.0.4](https://github.com/Language-Research-Technology/arocapi/compare/v1.0.3...v1.0.4) (2025-08-26)

### Bug Fixes

* add @prisma/config as a dependency for generate to work postinstall ([a180dfd](https://github.com/Language-Research-Technology/arocapi/commit/a180dfd151ab801ce67ecc37de14e6c105f4e824))

## [1.0.3](https://github.com/Language-Research-Technology/arocapi/compare/v1.0.2...v1.0.3) (2025-08-26)

### Bug Fixes

* add repository.url to package.json for provenance ([2cc35b9](https://github.com/Language-Research-Technology/arocapi/commit/2cc35b9d8c79ecc6037f77cf2ca00f29529ede0d))

## [1.0.2](https://github.com/Language-Research-Technology/arocapi/compare/v1.0.1...v1.0.2) (2025-08-26)

### Bug Fixes

* update zod ([69115f8](https://github.com/Language-Research-Technology/arocapi/commit/69115f83275805d2707ce241752edb54807443fb))

## [1.0.1](https://github.com/Language-Research-Technology/arocapi/compare/v1.0.0...v1.0.1) (2025-08-26)

### Bug Fixes

* publish to npm with semantic release ([e5f6418](https://github.com/Language-Research-Technology/arocapi/commit/e5f6418254b223286e17a9901e7624f08e545bfb))
* update package.json keywords ([bf286a3](https://github.com/Language-Research-Technology/arocapi/commit/bf286a3a79c6e6afe1d5632150496ba7536f7a30))

## 1.0.0 (2025-08-26)

### Features

* add CORS support ([93924b6](https://github.com/Language-Research-Technology/arocapi/commit/93924b6bec506358996b261ec72e811e433e7827))
* add mysql to docker ([f50fc95](https://github.com/Language-Research-Technology/arocapi/commit/f50fc957f898452013c1107155efc8971b8a20ec))
* bootstrap fastlify ([90660ac](https://github.com/Language-Research-Technology/arocapi/commit/90660ac9c88af8e79d2ffdf20cac324c3944c02f))
* implement rocrate path ([e50e86a](https://github.com/Language-Research-Technology/arocapi/commit/e50e86a22c4e2d06b122c5703c776d9d476a2b17))
* implement search api ([f7b0197](https://github.com/Language-Research-Technology/arocapi/commit/f7b0197d23988f21c6f2c52e1e494762bcd6b6de))
* Make the API mountable ([527b24e](https://github.com/Language-Research-Technology/arocapi/commit/527b24e70dd814fd92e3ceeeda52782afd8d293f))
* start on entities ([08c6d9b](https://github.com/Language-Research-Technology/arocapi/commit/08c6d9b1742f29650597491a11c9dd6955a050a6))

### Bug Fixes

* catch errors ([f860c67](https://github.com/Language-Research-Technology/arocapi/commit/f860c67c9f12e30edbd127c99ee1be333a2561d3))
* clean up the dist dir before dev ([690200a](https://github.com/Language-Research-Technology/arocapi/commit/690200a90cfbbab0e4ea7da0cdcd7d3ca6cee31c))
* database URL loading ([b0d6a1a](https://github.com/Language-Research-Technology/arocapi/commit/b0d6a1aa48b71fffcbbd64d957be860ec8705fa7))
* move to node type stripping instead of tsx ([c944bac](https://github.com/Language-Research-Technology/arocapi/commit/c944bac29ff222021629864cc9a41a03e3d57bd6))
* package.json name and description ([2227bde](https://github.com/Language-Research-Technology/arocapi/commit/2227bdead279bb818492830c2d9a056206da8adc))
* remove unneeded entries from tsconfig.json ([4b489da](https://github.com/Language-Research-Technology/arocapi/commit/4b489daded817ff8e75e8b54381069bd49958b6d))
* switch back to mysql 8 to avoide buffer errors ([59e8672](https://github.com/Language-Research-Technology/arocapi/commit/59e86721edd2dd57045937d46c66bb0bd3be6cd7))
* update pnpm lock ([254a2b5](https://github.com/Language-Research-Technology/arocapi/commit/254a2b55036500d33f2f75a5b97d0d10fd3c32d4))
