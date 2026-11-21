from fastapi import FastAPI, Request
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
