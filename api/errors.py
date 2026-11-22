"""Turn errors into consistent JSON responses the frontend can show:

    {"detail": "<message for the user>", "error_code": "<STABLE_CODE>"}
"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.schemas.errors import AppError


# Function to handle error from backend and turn it to appropriate JSON format
def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        headers = {}
        retry_after = getattr(exc, "retry_after", None)
        if retry_after:
            headers["Retry-After"] = str(int(retry_after) + 1)
        return JSONResponse(
            status_code=exc.http_status,
            content={"detail": exc.message, "error_code": exc.error_code},
            headers=headers or None,
        )

    # FastAPI's own 422 has a list in "detail"; flatten it to one readable sentence.
    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = exc.errors()
        if errors:
            first = errors[0]
            where = ".".join(str(p) for p in first.get("loc", []) if p not in ("body", "query", "path"))
            message = f"{where}: {first.get('msg')}" if where else str(first.get("msg"))
        else:
            message = "The request is invalid."
        return JSONResponse(status_code=422, content={"detail": message, "error_code": "INVALID_INPUT"})
