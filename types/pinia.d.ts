// types/pinia.d.ts @preserve

import "pinia";
import "pinia-plugin-persistedstate";
import type {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DefineSetupStoreOptions,
  _GettersTree,
  _ActionsTree,
  StateTree,
} from "pinia";

type PersistOptions =
  | boolean
  | import("pinia-plugin-persistedstate").PersistedStateOptions
  | Array<import("pinia-plugin-persistedstate").PersistedStateOptions>;

declare module "pinia" {
  export interface DefineStoreOptions<
    _Id extends string, // Prefixed with underscore
    S extends StateTree,
    _G extends _GettersTree<S>,
    _A extends _ActionsTree
  > {
    persist?: PersistOptions;
  }

  export interface DefineSetupStoreOptions<
    _Id extends string,
    _SS extends StateTree,
    _G,
    _A
  > {
    persist?: PersistOptions;
  }
}