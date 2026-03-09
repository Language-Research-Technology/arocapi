import type * as runtime from "@prisma/client/runtime/library";
import type * as Prisma from "../internal/prismaNamespace.js";
export type FileModel = runtime.Types.Result.DefaultSelection<Prisma.$FilePayload>;
export type AggregateFile = {
    _count: FileCountAggregateOutputType | null;
    _avg: FileAvgAggregateOutputType | null;
    _sum: FileSumAggregateOutputType | null;
    _min: FileMinAggregateOutputType | null;
    _max: FileMaxAggregateOutputType | null;
};
export type FileAvgAggregateOutputType = {
    id: number | null;
    size: number | null;
};
export type FileSumAggregateOutputType = {
    id: number | null;
    size: bigint | null;
};
export type FileMinAggregateOutputType = {
    id: number | null;
    fileId: string | null;
    filename: string | null;
    mediaType: string | null;
    size: bigint | null;
    memberOf: string | null;
    rootCollection: string | null;
    contentLicenseId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type FileMaxAggregateOutputType = {
    id: number | null;
    fileId: string | null;
    filename: string | null;
    mediaType: string | null;
    size: bigint | null;
    memberOf: string | null;
    rootCollection: string | null;
    contentLicenseId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type FileCountAggregateOutputType = {
    id: number;
    fileId: number;
    filename: number;
    mediaType: number;
    size: number;
    memberOf: number;
    rootCollection: number;
    contentLicenseId: number;
    meta: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type FileAvgAggregateInputType = {
    id?: true;
    size?: true;
};
export type FileSumAggregateInputType = {
    id?: true;
    size?: true;
};
export type FileMinAggregateInputType = {
    id?: true;
    fileId?: true;
    filename?: true;
    mediaType?: true;
    size?: true;
    memberOf?: true;
    rootCollection?: true;
    contentLicenseId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type FileMaxAggregateInputType = {
    id?: true;
    fileId?: true;
    filename?: true;
    mediaType?: true;
    size?: true;
    memberOf?: true;
    rootCollection?: true;
    contentLicenseId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type FileCountAggregateInputType = {
    id?: true;
    fileId?: true;
    filename?: true;
    mediaType?: true;
    size?: true;
    memberOf?: true;
    rootCollection?: true;
    contentLicenseId?: true;
    meta?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type FileAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FileWhereInput;
    orderBy?: Prisma.FileOrderByWithRelationInput | Prisma.FileOrderByWithRelationInput[];
    cursor?: Prisma.FileWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | FileCountAggregateInputType;
    _avg?: FileAvgAggregateInputType;
    _sum?: FileSumAggregateInputType;
    _min?: FileMinAggregateInputType;
    _max?: FileMaxAggregateInputType;
};
export type GetFileAggregateType<T extends FileAggregateArgs> = {
    [P in keyof T & keyof AggregateFile]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateFile[P]> : Prisma.GetScalarType<T[P], AggregateFile[P]>;
};
export type FileGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FileWhereInput;
    orderBy?: Prisma.FileOrderByWithAggregationInput | Prisma.FileOrderByWithAggregationInput[];
    by: Prisma.FileScalarFieldEnum[] | Prisma.FileScalarFieldEnum;
    having?: Prisma.FileScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: FileCountAggregateInputType | true;
    _avg?: FileAvgAggregateInputType;
    _sum?: FileSumAggregateInputType;
    _min?: FileMinAggregateInputType;
    _max?: FileMaxAggregateInputType;
};
export type FileGroupByOutputType = {
    id: number;
    fileId: string;
    filename: string;
    mediaType: string;
    size: bigint;
    memberOf: string;
    rootCollection: string;
    contentLicenseId: string;
    meta: unknown | null;
    createdAt: Date;
    updatedAt: Date;
    _count: FileCountAggregateOutputType | null;
    _avg: FileAvgAggregateOutputType | null;
    _sum: FileSumAggregateOutputType | null;
    _min: FileMinAggregateOutputType | null;
    _max: FileMaxAggregateOutputType | null;
};
type GetFileGroupByPayload<T extends FileGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<FileGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof FileGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], FileGroupByOutputType[P]> : Prisma.GetScalarType<T[P], FileGroupByOutputType[P]>;
}>>;
export type FileWhereInput = {
    AND?: Prisma.FileWhereInput | Prisma.FileWhereInput[];
    OR?: Prisma.FileWhereInput[];
    NOT?: Prisma.FileWhereInput | Prisma.FileWhereInput[];
    id?: Prisma.IntFilter<"File"> | number;
    fileId?: Prisma.StringFilter<"File"> | string;
    filename?: Prisma.StringFilter<"File"> | string;
    mediaType?: Prisma.StringFilter<"File"> | string;
    size?: Prisma.BigIntFilter<"File"> | bigint | number;
    memberOf?: Prisma.StringFilter<"File"> | string;
    rootCollection?: Prisma.StringFilter<"File"> | string;
    contentLicenseId?: Prisma.StringFilter<"File"> | string;
    meta?: Prisma.JsonNullableFilter<"File">;
    createdAt?: Prisma.DateTimeFilter<"File"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"File"> | Date | string;
};
export type FileOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    filename?: Prisma.SortOrder;
    mediaType?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
    memberOf?: Prisma.SortOrder;
    rootCollection?: Prisma.SortOrder;
    contentLicenseId?: Prisma.SortOrder;
    meta?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _relevance?: Prisma.FileOrderByRelevanceInput;
};
export type FileWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    fileId?: string;
    AND?: Prisma.FileWhereInput | Prisma.FileWhereInput[];
    OR?: Prisma.FileWhereInput[];
    NOT?: Prisma.FileWhereInput | Prisma.FileWhereInput[];
    filename?: Prisma.StringFilter<"File"> | string;
    mediaType?: Prisma.StringFilter<"File"> | string;
    size?: Prisma.BigIntFilter<"File"> | bigint | number;
    memberOf?: Prisma.StringFilter<"File"> | string;
    rootCollection?: Prisma.StringFilter<"File"> | string;
    contentLicenseId?: Prisma.StringFilter<"File"> | string;
    meta?: Prisma.JsonNullableFilter<"File">;
    createdAt?: Prisma.DateTimeFilter<"File"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"File"> | Date | string;
}, "id" | "fileId">;
export type FileOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    filename?: Prisma.SortOrder;
    mediaType?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
    memberOf?: Prisma.SortOrder;
    rootCollection?: Prisma.SortOrder;
    contentLicenseId?: Prisma.SortOrder;
    meta?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.FileCountOrderByAggregateInput;
    _avg?: Prisma.FileAvgOrderByAggregateInput;
    _max?: Prisma.FileMaxOrderByAggregateInput;
    _min?: Prisma.FileMinOrderByAggregateInput;
    _sum?: Prisma.FileSumOrderByAggregateInput;
};
export type FileScalarWhereWithAggregatesInput = {
    AND?: Prisma.FileScalarWhereWithAggregatesInput | Prisma.FileScalarWhereWithAggregatesInput[];
    OR?: Prisma.FileScalarWhereWithAggregatesInput[];
    NOT?: Prisma.FileScalarWhereWithAggregatesInput | Prisma.FileScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"File"> | number;
    fileId?: Prisma.StringWithAggregatesFilter<"File"> | string;
    filename?: Prisma.StringWithAggregatesFilter<"File"> | string;
    mediaType?: Prisma.StringWithAggregatesFilter<"File"> | string;
    size?: Prisma.BigIntWithAggregatesFilter<"File"> | bigint | number;
    memberOf?: Prisma.StringWithAggregatesFilter<"File"> | string;
    rootCollection?: Prisma.StringWithAggregatesFilter<"File"> | string;
    contentLicenseId?: Prisma.StringWithAggregatesFilter<"File"> | string;
    meta?: Prisma.JsonNullableWithAggregatesFilter<"File">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"File"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"File"> | Date | string;
};
export type FileCreateInput = {
    fileId: string;
    filename: string;
    mediaType: string;
    size: bigint | number;
    memberOf: string;
    rootCollection: string;
    contentLicenseId: string;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type FileUncheckedCreateInput = {
    id?: number;
    fileId: string;
    filename: string;
    mediaType: string;
    size: bigint | number;
    memberOf: string;
    rootCollection: string;
    contentLicenseId: string;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type FileUpdateInput = {
    fileId?: Prisma.StringFieldUpdateOperationsInput | string;
    filename?: Prisma.StringFieldUpdateOperationsInput | string;
    mediaType?: Prisma.StringFieldUpdateOperationsInput | string;
    size?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    memberOf?: Prisma.StringFieldUpdateOperationsInput | string;
    rootCollection?: Prisma.StringFieldUpdateOperationsInput | string;
    contentLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FileUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    fileId?: Prisma.StringFieldUpdateOperationsInput | string;
    filename?: Prisma.StringFieldUpdateOperationsInput | string;
    mediaType?: Prisma.StringFieldUpdateOperationsInput | string;
    size?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    memberOf?: Prisma.StringFieldUpdateOperationsInput | string;
    rootCollection?: Prisma.StringFieldUpdateOperationsInput | string;
    contentLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FileCreateManyInput = {
    id?: number;
    fileId: string;
    filename: string;
    mediaType: string;
    size: bigint | number;
    memberOf: string;
    rootCollection: string;
    contentLicenseId: string;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type FileUpdateManyMutationInput = {
    fileId?: Prisma.StringFieldUpdateOperationsInput | string;
    filename?: Prisma.StringFieldUpdateOperationsInput | string;
    mediaType?: Prisma.StringFieldUpdateOperationsInput | string;
    size?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    memberOf?: Prisma.StringFieldUpdateOperationsInput | string;
    rootCollection?: Prisma.StringFieldUpdateOperationsInput | string;
    contentLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FileUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    fileId?: Prisma.StringFieldUpdateOperationsInput | string;
    filename?: Prisma.StringFieldUpdateOperationsInput | string;
    mediaType?: Prisma.StringFieldUpdateOperationsInput | string;
    size?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    memberOf?: Prisma.StringFieldUpdateOperationsInput | string;
    rootCollection?: Prisma.StringFieldUpdateOperationsInput | string;
    contentLicenseId?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: unknown | Prisma.NullableJsonNullValueInput;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FileOrderByRelevanceInput = {
    fields: Prisma.FileOrderByRelevanceFieldEnum | Prisma.FileOrderByRelevanceFieldEnum[];
    sort: Prisma.SortOrder;
    search: string;
};
export type FileCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    filename?: Prisma.SortOrder;
    mediaType?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
    memberOf?: Prisma.SortOrder;
    rootCollection?: Prisma.SortOrder;
    contentLicenseId?: Prisma.SortOrder;
    meta?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type FileAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
};
export type FileMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    filename?: Prisma.SortOrder;
    mediaType?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
    memberOf?: Prisma.SortOrder;
    rootCollection?: Prisma.SortOrder;
    contentLicenseId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type FileMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    filename?: Prisma.SortOrder;
    mediaType?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
    memberOf?: Prisma.SortOrder;
    rootCollection?: Prisma.SortOrder;
    contentLicenseId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type FileSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
};
export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number;
    increment?: bigint | number;
    decrement?: bigint | number;
    multiply?: bigint | number;
    divide?: bigint | number;
};
export type FileSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    fileId?: boolean;
    filename?: boolean;
    mediaType?: boolean;
    size?: boolean;
    memberOf?: boolean;
    rootCollection?: boolean;
    contentLicenseId?: boolean;
    meta?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["file"]>;
export type FileSelectScalar = {
    id?: boolean;
    fileId?: boolean;
    filename?: boolean;
    mediaType?: boolean;
    size?: boolean;
    memberOf?: boolean;
    rootCollection?: boolean;
    contentLicenseId?: boolean;
    meta?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type FileOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "fileId" | "filename" | "mediaType" | "size" | "memberOf" | "rootCollection" | "contentLicenseId" | "meta" | "createdAt" | "updatedAt", ExtArgs["result"]["file"]>;
export type $FilePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "File";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        fileId: string;
        filename: string;
        mediaType: string;
        size: bigint;
        memberOf: string;
        rootCollection: string;
        contentLicenseId: string;
        meta: unknown | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["file"]>;
    composites: {};
};
export type FileGetPayload<S extends boolean | null | undefined | FileDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$FilePayload, S>;
export type FileCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<FileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: FileCountAggregateInputType | true;
};
export interface FileDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['File'];
        meta: {
            name: 'File';
        };
    };
    findUnique<T extends FileFindUniqueArgs>(args: Prisma.SelectSubset<T, FileFindUniqueArgs<ExtArgs>>): Prisma.Prisma__FileClient<runtime.Types.Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends FileFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, FileFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__FileClient<runtime.Types.Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends FileFindFirstArgs>(args?: Prisma.SelectSubset<T, FileFindFirstArgs<ExtArgs>>): Prisma.Prisma__FileClient<runtime.Types.Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends FileFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, FileFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__FileClient<runtime.Types.Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends FileFindManyArgs>(args?: Prisma.SelectSubset<T, FileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends FileCreateArgs>(args: Prisma.SelectSubset<T, FileCreateArgs<ExtArgs>>): Prisma.Prisma__FileClient<runtime.Types.Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends FileCreateManyArgs>(args?: Prisma.SelectSubset<T, FileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    delete<T extends FileDeleteArgs>(args: Prisma.SelectSubset<T, FileDeleteArgs<ExtArgs>>): Prisma.Prisma__FileClient<runtime.Types.Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends FileUpdateArgs>(args: Prisma.SelectSubset<T, FileUpdateArgs<ExtArgs>>): Prisma.Prisma__FileClient<runtime.Types.Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends FileDeleteManyArgs>(args?: Prisma.SelectSubset<T, FileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends FileUpdateManyArgs>(args: Prisma.SelectSubset<T, FileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    upsert<T extends FileUpsertArgs>(args: Prisma.SelectSubset<T, FileUpsertArgs<ExtArgs>>): Prisma.Prisma__FileClient<runtime.Types.Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends FileCountArgs>(args?: Prisma.Subset<T, FileCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], FileCountAggregateOutputType> : number>;
    aggregate<T extends FileAggregateArgs>(args: Prisma.Subset<T, FileAggregateArgs>): Prisma.PrismaPromise<GetFileAggregateType<T>>;
    groupBy<T extends FileGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: FileGroupByArgs['orderBy'];
    } : {
        orderBy?: FileGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, FileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: FileFieldRefs;
}
export interface Prisma__FileClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface FileFieldRefs {
    readonly id: Prisma.FieldRef<"File", 'Int'>;
    readonly fileId: Prisma.FieldRef<"File", 'String'>;
    readonly filename: Prisma.FieldRef<"File", 'String'>;
    readonly mediaType: Prisma.FieldRef<"File", 'String'>;
    readonly size: Prisma.FieldRef<"File", 'BigInt'>;
    readonly memberOf: Prisma.FieldRef<"File", 'String'>;
    readonly rootCollection: Prisma.FieldRef<"File", 'String'>;
    readonly contentLicenseId: Prisma.FieldRef<"File", 'String'>;
    readonly meta: Prisma.FieldRef<"File", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"File", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"File", 'DateTime'>;
}
export type FileFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FileSelect<ExtArgs> | null;
    omit?: Prisma.FileOmit<ExtArgs> | null;
    where: Prisma.FileWhereUniqueInput;
};
export type FileFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FileSelect<ExtArgs> | null;
    omit?: Prisma.FileOmit<ExtArgs> | null;
    where: Prisma.FileWhereUniqueInput;
};
export type FileFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FileSelect<ExtArgs> | null;
    omit?: Prisma.FileOmit<ExtArgs> | null;
    where?: Prisma.FileWhereInput;
    orderBy?: Prisma.FileOrderByWithRelationInput | Prisma.FileOrderByWithRelationInput[];
    cursor?: Prisma.FileWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FileScalarFieldEnum | Prisma.FileScalarFieldEnum[];
};
export type FileFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FileSelect<ExtArgs> | null;
    omit?: Prisma.FileOmit<ExtArgs> | null;
    where?: Prisma.FileWhereInput;
    orderBy?: Prisma.FileOrderByWithRelationInput | Prisma.FileOrderByWithRelationInput[];
    cursor?: Prisma.FileWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FileScalarFieldEnum | Prisma.FileScalarFieldEnum[];
};
export type FileFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FileSelect<ExtArgs> | null;
    omit?: Prisma.FileOmit<ExtArgs> | null;
    where?: Prisma.FileWhereInput;
    orderBy?: Prisma.FileOrderByWithRelationInput | Prisma.FileOrderByWithRelationInput[];
    cursor?: Prisma.FileWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FileScalarFieldEnum | Prisma.FileScalarFieldEnum[];
};
export type FileCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FileSelect<ExtArgs> | null;
    omit?: Prisma.FileOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FileCreateInput, Prisma.FileUncheckedCreateInput>;
};
export type FileCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.FileCreateManyInput | Prisma.FileCreateManyInput[];
    skipDuplicates?: boolean;
};
export type FileUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FileSelect<ExtArgs> | null;
    omit?: Prisma.FileOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FileUpdateInput, Prisma.FileUncheckedUpdateInput>;
    where: Prisma.FileWhereUniqueInput;
};
export type FileUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.FileUpdateManyMutationInput, Prisma.FileUncheckedUpdateManyInput>;
    where?: Prisma.FileWhereInput;
    limit?: number;
};
export type FileUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FileSelect<ExtArgs> | null;
    omit?: Prisma.FileOmit<ExtArgs> | null;
    where: Prisma.FileWhereUniqueInput;
    create: Prisma.XOR<Prisma.FileCreateInput, Prisma.FileUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.FileUpdateInput, Prisma.FileUncheckedUpdateInput>;
};
export type FileDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FileSelect<ExtArgs> | null;
    omit?: Prisma.FileOmit<ExtArgs> | null;
    where: Prisma.FileWhereUniqueInput;
};
export type FileDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FileWhereInput;
    limit?: number;
};
export type FileDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FileSelect<ExtArgs> | null;
    omit?: Prisma.FileOmit<ExtArgs> | null;
};
export {};
