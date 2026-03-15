import { NextResponse } from "next/server";
import {
    apiSuccess as canonicalApiSuccess,
    apiError as canonicalApiError,
} from "@/lib/api/response";

export type ApiSuccessResponse<T> = {
    data: T;
    error: null;
};

export type ApiErrorResponse = {
    data: null;
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
    return canonicalApiSuccess(data, { status });
}

export function apiError(error: string, status = 400, code?: string): NextResponse<ApiErrorResponse> {
    return canonicalApiError(error, status, code ? { code } : undefined);
}

export function apiPaginated<T>(
    data: T,
    meta: { total: number; page: number; limit: number },
    status = 200,
): NextResponse<ApiPaginatedResponse<T>> {
    return NextResponse.json(
        {
            data,
            error: null,
            meta: { ...meta, hasMore: meta.page * meta.limit < meta.total },
        },
        { status },
    );
}
