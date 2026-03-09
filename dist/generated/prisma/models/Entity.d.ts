import type * as runtime from "@prisma/client/runtime/library";
import type * as Prisma from "../internal/prismaNamespace.js";
export type EntityModel = runtime.Types.Result.DefaultSelection<Prisma.$EntityPayload>;
export type AggregateEntity = {
    _count: EntityCountAggregateOutputType | null;
    _avg: EntityAvgAggregateOutputType | null;
    _sum: EntitySumAggregateOutputType | null;
    _min: EntityMinAggregateOutputType | null;
    _max: EntityMaxAggregateOutputType | null;
};
export type EntityAvgAggregateOutputType = {
    id: number | null;
};
export type EntitySumAggregateOutputType = {
    id: number | null;
};
export type EntityMinAggregateOutputType = {
    id: number | null;
    rocrateId: string | null;
    name: string | null;
    description: string | null;
    entityType: string | null;
    memberOf: string | null;
    rootCollection: string | null;
    metadataLicenseId: string | null;
    contentLicenseId: string | null;
    fileId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type EntityMaxAggregateOutputType = {
    id: number | null;
    rocrateId: string | null;
    name: string | null;
    description: string | null;
    entityType: string | null;
    memberOf: string | null;
    rootCollection: string | null;
    metadataLicenseId: string | null;
    contentLicenseId: string | null;
    fileId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type EntityCountAggregateOutputType = {
    id: number;
    rocrateId: number;
    name: number;
    description: number;
    entityType: number;
    memberOf: number;
    rootCollection: number;
    metadataLicenseId: number;
    contentLicenseId: number;
    fileId: number;
    meta: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type EntityAvgAggregateInputType = {
    id?: true;
};
export type EntitySumAggregateInputType = {
    id?: true;
};
export type EntityMinAggregateInputType = {
    id?: true;
    rocrateId?: true;
    name?: true;
    description?: true;
    entityType?: true;
    memberOf?: true;
    rootCollection?: true;
    metadataLicenseId?: true;
    contentLicenseId?: true;
    fileId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type EntityMaxAggregateInputType = {
    id?: true;
    rocrateId?: true;
    name?: true;
    description?: true;
    entityType?: true;
    memberOf?: true;
    rootCollection?: true;
    metadataLicenseId?: true;
    contentLicenseId?: true;
    fileId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type EntityCountAggregateInputType = {
    id?: true;
    rocrateId?: true;
    name?: true;
    description?: true;
    entityType?: true;
    memberOf?: true;
    rootCollection?: true;
    metadataLicenseId?: true;
    contentLicenseId?: true;
    fileId?: true;
    meta?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type EntityAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.EntityWhereInput;
    orderBy?: Prisma.EntityOrderByWithRelationInput | Prisma.EntityOrderByWithRelationInput[];
    cursor?: Prisma.EntityWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | EntityCountAggregateInputType;
    _avg?: EntityAvgAggregateInputType;
    _sum?: EntitySumAggregateInputType;
    _min?: EntityMinAggregateInputType;
    _max?: EntityMaxAggregateInputType;
};
export type GetEntityAggregateType<T extends EntityAggregateArgs> = {
    [P in keyof T & keyof AggregateEntity]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateEntity[P]> : Prisma.GetScalarType<T[P], AggregateEntity[P]>;
};
export type EntityGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.EntityWhereInput;
    orderBy?: Prisma.EntityOrderByWithAggregationInput | Prisma.EntityOrderByWithAggregationInput[];
    by: Prisma.EntityScalarFieldEnum[] | Prisma.EntityScalarFieldEnum;
    having?: Prisma.EntityScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: EntityCountAggregateInputType | true;
    _avg?: EntityAvgAggregateInputType;
    _sum?: EntitySumAggregateInputType;
    _min?: EntityMinAggregateInputType;
    _max?: EntityMaxAggregateInputType;
};
export type EntityGroupByOutputType = {
    id: number;
    rocrateId: string;
    name: string;
    description: string;
    entityType: string;
    memberOf: string | null;
    rootCollection: string | null;
    metadataLicenseId: string;
    contentLicenseId: string;
    fileId: string | null;
    meta: unknown | null;
    createdAt: Date;
    updatedAt: Date;
    _count: EntityCountAggregateOutputType | null;
    _avg: EntityAvgAggregateOutputType | null;
    _sum: EntitySumAggregateOutputType | null;
    _min: EntityMinAggregateOutputType | null;
    _max: EntityMaxAggregateOutputType | null;
};
type GetEntityGroupByPayload<T extends EntityGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<EntityGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof EntityGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], EntityGroupByOutputType[P]> : Prisma.GetScalarType<T[P], EntityGroupByOutputType[P]>;
}>>;
export type EntityWhereInput = {
    AND?: Prisma.EntityWhereInput | Prisma.EntityWhereInput[];
    OR?: Prisma.EntityWhereInput[];
    NOT?: Prisma.EntityWhereInput | Prisma.EntityWhereInput[];
    id?: Prisma.IntFilter<"Entity"> | number;
    rocrateId?: Prisma.StringFilter<"Entity"> | string;
    name?: Prisma.StringFilter<"Entity"> | string;
    description?: Prisma.StringFilter<"Entity"> | string;
    entityType?: Prisma.StringFilter<"Entity"> | string;
    memberOf?: Prisma.StringNullableFilter<"Entity"> | string | null;
    rootCollection?: Prisma.StringNullableFilter<"Entity"> | string | null;
    metadataLicenseId?: Prisma.StringFilter<"Entity"> | string;
    contentLicenseId?: Prisma.StringFilter<"Entity"> | string;
    fileId?: Prisma.StringNullableFilter<"Entity"> | string | null;
    meta?: Prisma.JsonNullableFilter<"Entity">;
    createdAt?: Prisma.DateTimeFilter<"Entity"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Entity"> | Date | string;
};
export type EntityOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    rocrateId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    entityType?: Prisma.SortOrder;
    memberOf?: Prisma.SortOrderInput | Prisma.SortOrder;
    rootCollection?: Prisma.SortOrderInput | Prisma.SortOrder;
    metadataLicenseId?: Prisma.SortOrder;
    contentLicenseId?: Prisma.SortOrder;
    fileId?: Prisma.SortOrderInput | Prisma.SortOrder;
    meta?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _relevance?: Prisma.EntityOrderByRelevanceInput;
};
export type EntityWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.EntityWhereInput | Prisma.EntityWhereInput[];
    OR?: Prisma.EntityWhereInput[];
    NOT?: Prisma.EntityWhereInput | Prisma.EntityWhereInput[];
    rocrateId?: Prisma.StringFilter<"Entity"> | string;
    name?: Prisma.StringFilter<"Entity"> | string;
    description?: Prisma.StringFilter<"Entity"> | string;
    entityType?: Prisma.StringFilter<"Entity"> | string;
    memberOf?: Prisma.StringNullableFilter<"Entity"> | string | null;
    rootCollection?: Prisma.StringNullableFilter<"Entity"> | string | null;
    metadataLicenseId?: Prisma.StringFilter<"Entity"> | string;
    contentLicenseId?: Prisma.StringFilter<"Entity"> | string;
    fileId?: Prisma.StringNullableFilter<"Entity"> | string | null;
    meta?: Prisma.JsonNullableFilter<"Entity">;
    createdAt?: Prisma.DateTimeFilter<"Entity"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Entity"> | Date | string;
}, "id">;
export type EntityOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    rocrateId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    entityType?: Prisma.SortOrder;
    memberOf?: Prisma.SortOrderInput | Prisma.SortOrder;
    rootCollection?: Prisma.SortOrderInput | Prisma.SortOrder;
    metadataLicenseId?: Prisma.SortOrder;
    contentLicenseId?: Prisma.SortOrder;
    fileId?: Prisma.SortOrderInput | Prisma.SortOrder;
    meta?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.EntityCountOrderByAggregateInput;
    _avg?: Prisma.EntityAvgOrderByAggregateInput;
    _max?: Prisma.EntityMaxOrderByAggregateInput;
    _min?: Prisma.EntityMinOrderByAggregateInput;
    _sum?: Prisma.EntitySumOrderByAggregateInput;
};
export type EntityScalarWhereWithAggregatesInput = {
    AND?: Prisma.EntityScalarWhereWithAggregatesInput | Prisma.EntityScalarWhereWithAggregatesInput[];
    OR?: Prisma.EntityScalarWhereWithAggregatesInput[];
    NOT?: Prisma.EntityScalarWhereWithAggregatesInput | Prisma.EntityScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"Entity"> | number;
    rocrateId?: Prisma.StringWithAggregatesFilter<"Entity"> | string;
    name?: Prisma.StringWithAggregatesFilter<"Entity"> | string;
    description?: Prisma.StringWithAggregatesFilter<"Entity"> | string;
    entityType?: Prisma.StringWithAggregatesFilter<"Entity"> | string;
    memberOf?: Prisma.StringNullableWithAggregatesFilter<"Entity"> | string | null;
    rootCollection?: Prisma.StringNullableWithAggregatesFilter<"Entity"> | string | null;
    metadataLicenseId?: Prisma.StringWithAggregatesFilter<"Entity"> | string;
    contentLicenseId?: Prisma.StringWithAggregatesFilter<"Entity"> | string;
    fileId?: Prisma.StringNullableWithAggregatesFilter<"Entity"> | string | null;
    meta?: Prisma.JsonNullableWithAggregatesFilter<"Entity">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Entity"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Entity"> | Date | string;
};
export type EntityCreateInput = {
    rocrateId: string;
    name: string;
    description: string;
    entityType: string;
    memberOf?: string | null;
    rootCollection?: string | null;
    metadataLicenseId: string;
    contentLicenseId: string;
    fileId?: string | null;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type EntityUncheckedCreateInput = {
    id?: number;
    rocrateId: string;
    name: string;
    description: string;
    entityType: string;
    memberOf?: string | null;
    rootCollection?: string | null;
    metadataLicenseId: string;
    contentLicenseId: string;
    fileId?: string | null;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type EntityUpdateInput = {
    rocrateId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    entityType?: Prisma.StringFieldUpdateOperationsInput | string;
    memberOf?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rootCollection?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadataLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    contentLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    fileId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EntityUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    rocrateId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    entityType?: Prisma.StringFieldUpdateOperationsInput | string;
    memberOf?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rootCollection?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadataLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    contentLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    fileId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EntityCreateManyInput = {
    id?: number;
    rocrateId: string;
    name: string;
    description: string;
    entityType: string;
    memberOf?: string | null;
    rootCollection?: string | null;
    metadataLicenseId: string;
    contentLicenseId: string;
    fileId?: string | null;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type EntityUpdateManyMutationInput = {
    rocrateId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    entityType?: Prisma.StringFieldUpdateOperationsInput | string;
    memberOf?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rootCollection?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadataLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    contentLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    fileId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EntityUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    rocrateId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    entityType?: Prisma.StringFieldUpdateOperationsInput | string;
    memberOf?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rootCollection?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    metadataLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    contentLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    fileId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EntityOrderByRelevanceInput = {
    fields: Prisma.EntityOrderByRelevanceFieldEnum | Prisma.EntityOrderByRelevanceFieldEnum[];
    sort: Prisma.SortOrder;
    search: string;
};
export type EntityCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    rocrateId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    entityType?: Prisma.SortOrder;
    memberOf?: Prisma.SortOrder;
    rootCollection?: Prisma.SortOrder;
    metadataLicenseId?: Prisma.SortOrder;
    contentLicenseId?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    meta?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type EntityAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type EntityMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    rocrateId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    entityType?: Prisma.SortOrder;
    memberOf?: Prisma.SortOrder;
    rootCollection?: Prisma.SortOrder;
    metadataLicenseId?: Prisma.SortOrder;
    contentLicenseId?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type EntityMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    rocrateId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    entityType?: Prisma.SortOrder;
    memberOf?: Prisma.SortOrder;
    rootCollection?: Prisma.SortOrder;
    metadataLicenseId?: Prisma.SortOrder;
    contentLicenseId?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type EntitySumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type StringFieldUpdateOperationsInput = {
    set?: string;
};
export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
};
export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type EntitySelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    rocrateId?: boolean;
    name?: boolean;
    description?: boolean;
    entityType?: boolean;
    memberOf?: boolean;
    rootCollection?: boolean;
    metadataLicenseId?: boolean;
    contentLicenseId?: boolean;
    fileId?: boolean;
    meta?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["entity"]>;
export type EntitySelectScalar = {
    id?: boolean;
    rocrateId?: boolean;
    name?: boolean;
    description?: boolean;
    entityType?: boolean;
    memberOf?: boolean;
    rootCollection?: boolean;
    metadataLicenseId?: boolean;
    contentLicenseId?: boolean;
    fileId?: boolean;
    meta?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type EntityOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "rocrateId" | "name" | "description" | "entityType" | "memberOf" | "rootCollection" | "metadataLicenseId" | "contentLicenseId" | "fileId" | "meta" | "createdAt" | "updatedAt", ExtArgs["result"]["entity"]>;
export type $EntityPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Entity";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        rocrateId: string;
        name: string;
        description: string;
        entityType: string;
        memberOf: string | null;
        rootCollection: string | null;
        metadataLicenseId: string;
        contentLicenseId: string;
        fileId: string | null;
        meta: unknown | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["entity"]>;
    composites: {};
};
export type EntityGetPayload<S extends boolean | null | undefined | EntityDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$EntityPayload, S>;
export type EntityCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<EntityFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: EntityCountAggregateInputType | true;
};
export interface EntityDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Entity'];
        meta: {
            name: 'Entity';
        };
    };
    findUnique<T extends EntityFindUniqueArgs>(args: Prisma.SelectSubset<T, EntityFindUniqueArgs<ExtArgs>>): Prisma.Prisma__EntityClient<runtime.Types.Result.GetResult<Prisma.$EntityPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends EntityFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, EntityFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__EntityClient<runtime.Types.Result.GetResult<Prisma.$EntityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends EntityFindFirstArgs>(args?: Prisma.SelectSubset<T, EntityFindFirstArgs<ExtArgs>>): Prisma.Prisma__EntityClient<runtime.Types.Result.GetResult<Prisma.$EntityPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends EntityFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, EntityFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__EntityClient<runtime.Types.Result.GetResult<Prisma.$EntityPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends EntityFindManyArgs>(args?: Prisma.SelectSubset<T, EntityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$EntityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends EntityCreateArgs>(args: Prisma.SelectSubset<T, EntityCreateArgs<ExtArgs>>): Prisma.Prisma__EntityClient<runtime.Types.Result.GetResult<Prisma.$EntityPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends EntityCreateManyArgs>(args?: Prisma.SelectSubset<T, EntityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    delete<T extends EntityDeleteArgs>(args: Prisma.SelectSubset<T, EntityDeleteArgs<ExtArgs>>): Prisma.Prisma__EntityClient<runtime.Types.Result.GetResult<Prisma.$EntityPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends EntityUpdateArgs>(args: Prisma.SelectSubset<T, EntityUpdateArgs<ExtArgs>>): Prisma.Prisma__EntityClient<runtime.Types.Result.GetResult<Prisma.$EntityPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends EntityDeleteManyArgs>(args?: Prisma.SelectSubset<T, EntityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends EntityUpdateManyArgs>(args: Prisma.SelectSubset<T, EntityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    upsert<T extends EntityUpsertArgs>(args: Prisma.SelectSubset<T, EntityUpsertArgs<ExtArgs>>): Prisma.Prisma__EntityClient<runtime.Types.Result.GetResult<Prisma.$EntityPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends EntityCountArgs>(args?: Prisma.Subset<T, EntityCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], EntityCountAggregateOutputType> : number>;
    aggregate<T extends EntityAggregateArgs>(args: Prisma.Subset<T, EntityAggregateArgs>): Prisma.PrismaPromise<GetEntityAggregateType<T>>;
    groupBy<T extends EntityGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: EntityGroupByArgs['orderBy'];
    } : {
        orderBy?: EntityGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, EntityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEntityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: EntityFieldRefs;
}
export interface Prisma__EntityClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface EntityFieldRefs {
    readonly id: Prisma.FieldRef<"Entity", 'Int'>;
    readonly rocrateId: Prisma.FieldRef<"Entity", 'String'>;
    readonly name: Prisma.FieldRef<"Entity", 'String'>;
    readonly description: Prisma.FieldRef<"Entity", 'String'>;
    readonly entityType: Prisma.FieldRef<"Entity", 'String'>;
    readonly memberOf: Prisma.FieldRef<"Entity", 'String'>;
    readonly rootCollection: Prisma.FieldRef<"Entity", 'String'>;
    readonly metadataLicenseId: Prisma.FieldRef<"Entity", 'String'>;
    readonly contentLicenseId: Prisma.FieldRef<"Entity", 'String'>;
    readonly fileId: Prisma.FieldRef<"Entity", 'String'>;
    readonly meta: Prisma.FieldRef<"Entity", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"Entity", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Entity", 'DateTime'>;
}
export type EntityFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EntitySelect<ExtArgs> | null;
    omit?: Prisma.EntityOmit<ExtArgs> | null;
    where: Prisma.EntityWhereUniqueInput;
};
export type EntityFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EntitySelect<ExtArgs> | null;
    omit?: Prisma.EntityOmit<ExtArgs> | null;
    where: Prisma.EntityWhereUniqueInput;
};
export type EntityFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EntitySelect<ExtArgs> | null;
    omit?: Prisma.EntityOmit<ExtArgs> | null;
    where?: Prisma.EntityWhereInput;
    orderBy?: Prisma.EntityOrderByWithRelationInput | Prisma.EntityOrderByWithRelationInput[];
    cursor?: Prisma.EntityWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.EntityScalarFieldEnum | Prisma.EntityScalarFieldEnum[];
};
export type EntityFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EntitySelect<ExtArgs> | null;
    omit?: Prisma.EntityOmit<ExtArgs> | null;
    where?: Prisma.EntityWhereInput;
    orderBy?: Prisma.EntityOrderByWithRelationInput | Prisma.EntityOrderByWithRelationInput[];
    cursor?: Prisma.EntityWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.EntityScalarFieldEnum | Prisma.EntityScalarFieldEnum[];
};
export type EntityFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EntitySelect<ExtArgs> | null;
    omit?: Prisma.EntityOmit<ExtArgs> | null;
    where?: Prisma.EntityWhereInput;
    orderBy?: Prisma.EntityOrderByWithRelationInput | Prisma.EntityOrderByWithRelationInput[];
    cursor?: Prisma.EntityWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.EntityScalarFieldEnum | Prisma.EntityScalarFieldEnum[];
};
export type EntityCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EntitySelect<ExtArgs> | null;
    omit?: Prisma.EntityOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.EntityCreateInput, Prisma.EntityUncheckedCreateInput>;
};
export type EntityCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.EntityCreateManyInput | Prisma.EntityCreateManyInput[];
    skipDuplicates?: boolean;
};
export type EntityUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EntitySelect<ExtArgs> | null;
    omit?: Prisma.EntityOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.EntityUpdateInput, Prisma.EntityUncheckedUpdateInput>;
    where: Prisma.EntityWhereUniqueInput;
};
export type EntityUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.EntityUpdateManyMutationInput, Prisma.EntityUncheckedUpdateManyInput>;
    where?: Prisma.EntityWhereInput;
    limit?: number;
};
export type EntityUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EntitySelect<ExtArgs> | null;
    omit?: Prisma.EntityOmit<ExtArgs> | null;
    where: Prisma.EntityWhereUniqueInput;
    create: Prisma.XOR<Prisma.EntityCreateInput, Prisma.EntityUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.EntityUpdateInput, Prisma.EntityUncheckedUpdateInput>;
};
export type EntityDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EntitySelect<ExtArgs> | null;
    omit?: Prisma.EntityOmit<ExtArgs> | null;
    where: Prisma.EntityWhereUniqueInput;
};
export type EntityDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.EntityWhereInput;
    limit?: number;
};
export type EntityDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EntitySelect<ExtArgs> | null;
    omit?: Prisma.EntityOmit<ExtArgs> | null;
};
export {};
