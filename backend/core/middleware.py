from django.middleware.gzip import GZipMiddleware
from rest_framework.response import Response
from rest_framework import status
from django.utils.deprecation import MiddlewareMixin
import json


class APIVersionMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.path.startswith('/api/'):
            version = request.headers.get('Accept-Version', 'v1')
            request.version = version

    def process_response(self, request, response):
        if hasattr(request, 'version'):
            response['API-Version'] = request.version
        return response


class CustomGZipMiddleware(GZipMiddleware):
    def process_response(self, request, response):
        if isinstance(response, Response):
            # Render DRF Response before compression
            response.render()
            # Convert rendered content to bytes
            content = response.content
            # Check if content should be compressed
            if self.should_compress(request, response, content):
                # Compress the content
                compressed_content = self.compress_content(request, content)
                response.content = compressed_content
                response['Content-Encoding'] = 'gzip'
                response['Content-Length'] = str(len(compressed_content))
        return response

    def should_compress(self, request, response, content):
        # Check for gzip support in request
        if 'gzip' not in request.META.get('HTTP_ACCEPT_ENCODING', ''):
            return False
        # Don't compress small responses
        if len(content) < 200:
            return False
        return True

    def compress_content(self, request, content):
        import gzip
        from io import BytesIO
        stream = BytesIO()
        with gzip.GzipFile(mode='wb', fileobj=stream) as gzip_file:
            gzip_file.write(content if isinstance(
                content, bytes) else content.encode('utf-8'))
        return stream.getvalue()
