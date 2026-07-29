import {
  NextRequest,
  NextResponse,
} from "next/server";

export async function POST(
  request: NextRequest
) {
  const response = NextResponse.json({
    success: true,
  });

  const cookies =
    request.cookies.getAll();

  for (const cookie of cookies) {
    response.cookies.set(
      cookie.name,
      "",
      {
        path: "/",
        maxAge: 0,
      }
    );
  }

  return response;
}

export async function GET(
  request: NextRequest
) {
  return POST(request);
}