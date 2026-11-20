"""Domain errors. Each carries the HTTP status and a stable error_code for the API.

The API layer (added in Step 3) turns any AppError into
    {"detail": <message>, "error_code": <error_code>}
with the matching status code. The frontend reads `detail` in client.ts.
"""


class AppError(Exception):
    http_status: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class InvalidInputError(AppError):
    http_status = 422
    error_code = "INVALID_INPUT"


class UnsupportedFileError(AppError):
    http_status = 415
    error_code = "UNSUPPORTED_FILE"


class FileTooLargeError(AppError):
    http_status = 413
    error_code = "FILE_TOO_LARGE"


class CorruptPDFError(AppError):
    http_status = 422
    error_code = "CORRUPT_PDF"


class ScannedPDFError(AppError):
    http_status = 422
    error_code = "SCANNED_PDF"


class NotFoundError(AppError):
    http_status = 404
    error_code = "NOT_FOUND"


class LLMUnavailableError(AppError):
    http_status = 503
    error_code = "LLM_UNAVAILABLE"


class LLMOutputInvalidError(AppError):
    http_status = 502
    error_code = "LLM_OUTPUT_INVALID"


class IndexNotReadyError(AppError):
    http_status = 503
    error_code = "INDEX_NOT_READY"
