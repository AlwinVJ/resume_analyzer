"""Validate an uploaded resume and extract its text, with a clear error for every failure."""
import fitz  # PyMuPDF

from configs.settings import settings
from src.schemas.errors import (
    CorruptPDFError,
    FileTooLargeError,
    InvalidInputError,
    ScannedPDFError,
    UnsupportedFileError,
)


def read_limited(stream, max_mb: int | None = None) -> bytes:
    """Read an upload, stopping just past the size limit so huge files are not loaded fully."""
    limit = (max_mb or settings.MAX_UPLOAD_MB) * 1024 * 1024
    data = stream.read(limit + 1)
    if len(data) > limit:
        raise FileTooLargeError(f"The uploaded file exceeds the {settings.MAX_UPLOAD_MB}MB limit.")
    return data


def extract_pdf_text(data: bytes, file_name: str | None) -> tuple[str, int]:
    """Return (text, page_count) or raise an AppError that explains the problem."""
    if not data:
        raise InvalidInputError("The uploaded file is empty.")
    if len(data) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise FileTooLargeError(f"The uploaded file exceeds the {settings.MAX_UPLOAD_MB}MB limit.")
    if not (file_name or "").lower().endswith(".pdf") or not data.lstrip()[:5].startswith(b"%PDF-"):
        raise UnsupportedFileError("Only PDF resumes are supported. Please upload a .pdf file.")

    try:
        document = fitz.open(stream=data, filetype="pdf")
    except Exception as e:
        raise CorruptPDFError("The PDF could not be opened. It may be damaged; try exporting it again.") from e

    try:
        if document.needs_pass:
            raise CorruptPDFError("The PDF is password-protected. Please upload an unprotected copy.")
        pages = document.page_count
        if pages > settings.MAX_PAGES:
            raise InvalidInputError(f"The resume has {pages} pages; the limit is {settings.MAX_PAGES}.")
        try:
            text = "\n".join(page.get_text() for page in document)
        except Exception as e:
            raise CorruptPDFError("The PDF's text could not be read. It may be damaged.") from e
    finally:
        document.close()

    # Drop bullet-only lines that some PDF exporters add, then check there is real text.
    lines = [line for line in text.splitlines() if line.strip(" •·▪●◦-–*\t")]
    text = "\n".join(lines).strip()
    if len(text) < settings.MIN_RESUME_CHARS:
        raise ScannedPDFError(
            "Almost no text could be read from this PDF. It is probably a scanned image; "
            "please upload a PDF with selectable text.")
    return text, pages
