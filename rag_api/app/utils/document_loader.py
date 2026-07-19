# app/utils/document_loader.py

import os
import codecs
import tempfile
import threading

from typing import Iterator, List, Optional
import chardet

from langchain_core.documents import Document

from app.config import known_source_ext, PDF_EXTRACT_IMAGES, CHUNK_OVERLAP, logger
from langchain_community.document_loaders import (
    TextLoader,
    PyMuPDFLoader,
    CSVLoader,
    Docx2txtLoader,
    UnstructuredEPubLoader,
    UnstructuredMarkdownLoader,
    UnstructuredXMLLoader,
    UnstructuredRSTLoader,
    UnstructuredExcelLoader,
    UnstructuredPowerPointLoader,
)


def detect_file_encoding(filepath: str) -> str:
    """
    Detect the encoding of a file using BOM markers and chardet for broader support.
    Returns the detected encoding or 'utf-8' as default.
    """
    with open(filepath, "rb") as f:
        raw = f.read(4096)  # Read a larger sample for better detection

    # Check for BOM markers first
    if raw.startswith(codecs.BOM_UTF16_LE):
        return "utf-16-le"
    elif raw.startswith(codecs.BOM_UTF16_BE):
        return "utf-16-be"
    elif raw.startswith(codecs.BOM_UTF16):
        return "utf-16"
    elif raw.startswith(codecs.BOM_UTF8):
        return "utf-8-sig"
    elif raw.startswith(codecs.BOM_UTF32_LE):
        return "utf-32-le"
    elif raw.startswith(codecs.BOM_UTF32_BE):
        return "utf-32-be"

    # Use chardet to detect encoding if no BOM is found
    result = chardet.detect(raw)
    encoding = result.get("encoding")
    if encoding:
        return encoding.lower()
    # Default to utf-8 if detection fails
    return "utf-8"


def cleanup_temp_encoding_file(loader) -> None:
    """
    Clean up temporary UTF-8 file if it was created for encoding conversion.

    :param loader: The document loader that may have created a temporary file
    """
    if hasattr(loader, "_temp_filepath") and loader._temp_filepath is not None:
        try:
            os.remove(loader._temp_filepath)
        except Exception as e:
            logger.warning(f"Failed to remove temporary UTF-8 file: {e}")


def get_loader(filename: str, file_content_type: str, filepath: str):
    """Get the appropriate document loader based on file type and/or content type."""
    file_ext = filename.split(".")[-1].lower()
    known_type = True

    # File Content Type reference:
    # ref.: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types/Common_types
    if file_ext == "pdf" or file_content_type == "application/pdf":
        loader = SafePyPDFLoader(filepath, extract_images=PDF_EXTRACT_IMAGES)
    elif file_ext == "csv" or file_content_type == "text/csv":
        # Detect encoding for CSV files
        encoding = detect_file_encoding(filepath)

        if encoding != "utf-8":
            # For non-UTF-8 encodings, convert to UTF-8 using streaming
            # to avoid holding the entire file in memory as a single string
            temp_file = None
            try:
                with tempfile.NamedTemporaryFile(
                    mode="w", encoding="utf-8", suffix=".csv", delete=False
                ) as temp_file:
                    with open(
                        filepath, "r", encoding=encoding, errors="replace"
                    ) as original_file:
                        while True:
                            chunk = original_file.read(64 * 1024)
                            if not chunk:
                                break
                            temp_file.write(chunk)

                    temp_filepath = temp_file.name

                loader = CSVLoader(temp_filepath)
                loader._temp_filepath = temp_filepath
            except Exception as e:
                if temp_file and os.path.exists(temp_file.name):
                    os.unlink(temp_file.name)
                raise e
        else:
            loader = CSVLoader(filepath)
    elif file_ext == "rst":
        loader = UnstructuredRSTLoader(filepath, mode="elements")
    elif file_ext == "xml" or file_content_type in [
        "application/xml",
        "text/xml",
        "application/xhtml+xml",
    ]:
        loader = UnstructuredXMLLoader(filepath)
    elif file_ext in ["ppt", "pptx"] or file_content_type in [
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]:
        loader = UnstructuredPowerPointLoader(filepath)
    elif file_ext == "md" or file_content_type in [
        "text/markdown",
        "text/x-markdown",
        "application/markdown",
        "application/x-markdown",
    ]:
        loader = UnstructuredMarkdownLoader(filepath)
    elif file_ext == "epub" or file_content_type == "application/epub+zip":
        loader = UnstructuredEPubLoader(filepath)
    elif file_ext in ["doc", "docx"] or file_content_type in [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]:
        loader = SafeWordLoader(filepath)
    elif file_ext in ["xls", "xlsx"] or file_content_type in [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]:
        loader = PandasExcelLoader(filepath)
    elif file_ext == "json" or file_content_type == "application/json":
        loader = TextLoader(filepath, autodetect_encoding=True)
    elif file_ext in known_source_ext or (
        file_content_type and file_content_type.find("text/") >= 0
    ):
        loader = TextLoader(filepath, autodetect_encoding=True)
    else:
        loader = TextLoader(filepath, autodetect_encoding=True)
        known_type = False

    return loader, known_type, file_ext


def clean_text(text: str) -> str:
    """
    Clean up text from PDF lopader

    :param text: The original text
    :return: Cleaned text
    """
    text = remove_null(text)
    text = remove_non_utf8(text)
    return text


def remove_null(text: str) -> str:
    """
    Remove NUL (0x00) characters from a string.

    :param text: The original text with potential NUL characters.
    :return: Cleaned text without NUL characters.
    """
    return text.replace("\x00", "")


def remove_non_utf8(text: str) -> str:
    """
    Remove invalid UTF-8 characters from a string, such as surrogate characters

    :param text: The original text with potential invalid utf-8 characters
    :return: Cleaned text without invalid utf-8 characters.
    """
    try:
        return text.encode("utf-8", "ignore").decode("utf-8")
    except UnicodeError:
        return text


def process_documents(documents: List[Document]) -> str:
    processed_text = ""
    last_page: Optional[int] = None
    doc_basename = ""

    for doc in documents:
        if "source" in doc.metadata:
            doc_basename = doc.metadata["source"].split("/")[-1]
            break

    processed_text += f"{doc_basename}\n"

    for doc in documents:
        current_page = doc.metadata.get("page")
        if current_page and current_page != last_page:
            processed_text += f"\n# PAGE {doc.metadata['page']}\n\n"
            last_page = current_page

        new_content = doc.page_content
        if processed_text.endswith(new_content[:CHUNK_OVERLAP]):
            processed_text += new_content[CHUNK_OVERLAP:]
        else:
            processed_text += new_content

    return processed_text.strip()


pdf_extraction_lock = threading.Lock()


class SafePyPDFLoader:
    """
    A wrapper around PyPDFLoader that handles image extraction failures gracefully.
    Falls back to text-only extraction when image extraction fails.
    Also falls back to PyPDFLoader or UnstructuredPDFLoader if PyMuPDFLoader fails.
    """

    def __init__(self, filepath: str, extract_images: bool = False):
        self.filepath = filepath
        self.extract_images = extract_images
        self._temp_filepath = None  # For compatibility with cleanup function

    def lazy_load(self) -> Iterator[Document]:
        with pdf_extraction_lock:
            # 1. Try PyMuPDFLoader first (fastest and handles formatting well)
            try:
                from langchain_community.document_loaders import PyMuPDFLoader
                loader = PyMuPDFLoader(self.filepath)
                pages = list(loader.lazy_load())
                if pages:
                    yield from pages
                    return
            except Exception as e:
                logger.warning(
                    f"PyMuPDFLoader failed for {self.filepath}: {e}. Trying PyPDFLoader fallback."
                )

            # 2. Try PyPDFLoader (pure Python, highly reliable)
            try:
                from langchain_community.document_loaders import PyPDFLoader
                loader = PyPDFLoader(self.filepath)
                pages = list(loader.lazy_load())
                if pages:
                    yield from pages
                    return
            except Exception as e:
                logger.warning(
                    f"PyPDFLoader failed for {self.filepath}: {e}. Trying Unstructured fallback."
                )

            # 3. Try UnstructuredPDFLoader
            try:
                from langchain_community.document_loaders import UnstructuredPDFLoader
                loader = UnstructuredPDFLoader(self.filepath)
                pages = list(loader.lazy_load())
                if pages:
                    yield from pages
                    return
            except Exception as e:
                logger.error(f"All PDF loading strategies failed for {self.filepath}: {e}")
                raise

    def load(self) -> List[Document]:
        return list(self.lazy_load())


class SafeWordLoader:
    """
    A robust Word document loader that uses Docx2txtLoader for .docx,
    and falls back to UnstructuredWordDocumentLoader or other text extraction strategies.
    Handles legacy .doc files via UnstructuredWordDocumentLoader.
    """

    def __init__(self, filepath: str):
        self.filepath = filepath
        self._temp_filepath = None  # For compatibility with cleanup function

    def lazy_load(self) -> Iterator[Document]:
        file_ext = self.filepath.split(".")[-1].lower()

        # 1. For .docx, try Docx2txtLoader first
        if file_ext == "docx":
            try:
                from langchain_community.document_loaders import Docx2txtLoader
                loader = Docx2txtLoader(self.filepath)
                pages = list(loader.lazy_load())
                if pages:
                    yield from pages
                    return
            except Exception as e:
                logger.warning(
                    f"Docx2txtLoader failed for {self.filepath}: {e}. Trying fallback."
                )

        # 2. Try UnstructuredWordDocumentLoader (supports both doc and docx)
        try:
            from langchain_community.document_loaders import UnstructuredWordDocumentLoader
            loader = UnstructuredWordDocumentLoader(self.filepath)
            pages = list(loader.lazy_load())
            if pages:
                yield from pages
                return
        except Exception as e:
            logger.warning(
                f"UnstructuredWordDocumentLoader failed for {self.filepath}: {e}. Trying raw text conversion."
            )

        # 3. Fallback to pypandoc (since pandoc is installed in the container)
        try:
            import pypandoc
            text = pypandoc.convert_file(self.filepath, "plain")
            if text:
                yield Document(page_content=text, metadata={"source": self.filepath})
                return
        except Exception as e:
            logger.warning(
                f"pypandoc conversion failed for {self.filepath}: {e}."
            )

        # 4. If all else fails, raise error
        raise ValueError(f"Failed to load Word document {self.filepath} with any strategy.")

    def load(self) -> List[Document]:
        return list(self.lazy_load())


class PandasExcelLoader:
    """
    A robust Excel document loader using pandas and openpyxl.
    Parses each sheet of the Excel spreadsheet into a clean CSV/Markdown format.
    Does not require system dependencies like libmagic.
    """

    def __init__(self, filepath: str):
        self.filepath = filepath
        self._temp_filepath = None  # For compatibility with cleanup function

    def lazy_load(self) -> Iterator[Document]:
        """Lazy load each sheet in the Excel file."""
        import pandas as pd

        try:
            xls = pd.ExcelFile(self.filepath)
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(xls, sheet_name=sheet_name)
                df = df.fillna("")
                
                # Try to use to_markdown for beautiful structured reading by LLMs if tabulate is installed
                try:
                    import tabulate
                    table_content = df.to_markdown(index=False)
                except ImportError:
                    # Fallback to CSV format which all LLMs understand perfectly
                    table_content = df.to_csv(index=False)

                content = f"### Hoja: {sheet_name}\n\n{table_content}"
                yield Document(
                    page_content=content,
                    metadata={"source": self.filepath, "sheet": sheet_name}
                )
        except Exception as e:
            logger.error(f"Error loading Excel with Pandas: {e}")
            raise

    def load(self) -> List[Document]:
        """Load sheets from the Excel file."""
        return list(self.lazy_load())
