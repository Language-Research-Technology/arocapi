import * as Prisma from './internal/prismaNamespace.js';
declare global {
    namespace PrismaJson {
    }
}
export type NullableListFilter<T> = {
    equals?: T | T[] | null;
    has?: T | null;
    hasEvery?: T[];
    hasSome?: T[];
    isEmpty?: boolean;
};
export type UpdateInput<T> = T extends object ? {
    [P in keyof T]?: UpdateInput<T[P]>;
} : T;
export type UpdateManyInput<T> = T | T[] | {
    set?: T[];
    push?: T | T[];
};
export type CreateManyInput<T> = T | T[] | {
    set?: T[];
};
export type TypedNestedStringFilter<S extends string> = Prisma.StringFilter & {
    equals?: S;
    in?: S[];
    notIn?: S[];
    not?: TypedNestedStringFilter<S> | S;
};
export type TypedStringFilter<S extends string> = Prisma.StringFilter & {
    equals?: S;
    in?: S[];
    notIn?: S[];
    not?: TypedNestedStringFilter<S> | S;
};
export type TypedNestedStringNullableFilter<S extends string> = Prisma.StringNullableFilter & {
    equals?: S | null;
    in?: S[] | null;
    notIn?: S[] | null;
    not?: TypedNestedStringNullableFilter<S> | S | null;
};
export type TypedStringNullableFilter<S extends string> = Prisma.StringNullableFilter & {
    equals?: S | null;
    in?: S[] | null;
    notIn?: S[] | null;
    not?: TypedNestedStringNullableFilter<S> | S | null;
};
export type TypedNestedStringWithAggregatesFilter<S extends string> = Prisma.NestedStringWithAggregatesFilter & {
    equals?: S;
    in?: S[];
    notIn?: S[];
    not?: TypedNestedStringWithAggregatesFilter<S> | S;
};
export type TypedStringWithAggregatesFilter<S extends string> = Prisma.StringWithAggregatesFilter & {
    equals?: S;
    in?: S[];
    notIn?: S[];
    not?: TypedNestedStringWithAggregatesFilter<S> | S;
};
export type TypedNestedStringNullableWithAggregatesFilter<S extends string> = Prisma.NestedStringNullableWithAggregatesFilter & {
    equals?: S | null;
    in?: S[] | null;
    notIn?: S[] | null;
    not?: TypedNestedStringNullableWithAggregatesFilter<S> | S | null;
};
export type TypedStringNullableWithAggregatesFilter<S extends string> = Prisma.StringNullableWithAggregatesFilter & {
    equals?: S | null;
    in?: S[] | null;
    notIn?: S[] | null;
    not?: TypedNestedStringNullableWithAggregatesFilter<S> | S | null;
};
export type TypedStringFieldUpdateOperationsInput<S extends string> = Prisma.StringFieldUpdateOperationsInput & {
    set?: S;
};
export type TypedNullableStringFieldUpdateOperationsInput<S extends string> = Prisma.NullableStringFieldUpdateOperationsInput & {
    set?: S | null;
};
export type TypedStringNullableListFilter<S extends string> = Prisma.StringNullableListFilter & {
    equals?: S[] | null;
    has?: S | null;
    hasEvery?: S[];
    hasSome?: S[];
};
export type UpdateStringArrayInput<S extends string> = {
    set?: S[];
    push?: S | S[];
};
export type CreateStringArrayInput<S extends string> = {
    set?: S[];
};
