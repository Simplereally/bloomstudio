import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname !== "/") {
        return NextResponse.next()
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-bloom-public-shell", "maintenance")

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}

export const config = {
    matcher: ["/"],
}
