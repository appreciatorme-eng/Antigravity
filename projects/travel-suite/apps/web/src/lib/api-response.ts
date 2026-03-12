import { NextResponse } from "next/server";

export type ApiSuccessResponse<T> = {
    success: true;
    data: T;
};

export type ApiErrorResponse = {
    success: false;
    error: string;
    code?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ApiPaginatedResponse<T> = ApiSuccessResponse<T> & {
    meta: {
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    };
};

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json({ success: true as const, data }, { status });
}

export function apiError(error: string, status = 400, code?: string): NextResponse<ApiErrorResponse> {
    return NextResponse.json({ success: false as const, error, ...(code ? { code } : {}) }, { status });
}

export function apiPaginated<T>(
    data: T,
    meta: { total: number; page: number; limit: number },
    status = 200,
): NextResponse<ApiPaginatedResponse<T>> {
    return NextResponse.json(
        {
            success: true as const,
            data,
            meta: { ...meta, hasMore: meta.page * meta.limit < meta.total },
        },
        { status },
    );
}
