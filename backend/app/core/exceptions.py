class AppException(Exception):
	def __init__(self, detail: str, status_code: int) -> None:
		self.detail = detail
		self.status_code = status_code
		super().__init__(detail)


class NotFoundException(AppException):
	def __init__(self, detail: str = "Không tìm thấy dữ liệu.") -> None:
		super().__init__(detail=detail, status_code=404)


class ConflictException(AppException):
	def __init__(self, detail: str = "Dữ liệu đã tồn tại.") -> None:
		super().__init__(detail=detail, status_code=409)


class UnauthorizedException(AppException):
	def __init__(self, detail: str = "Không được xác thực.") -> None:
		super().__init__(detail=detail, status_code=401)


class BadRequestException(AppException):
	def __init__(self, detail: str = "Yêu cầu không hợp lệ.") -> None:
		super().__init__(detail=detail, status_code=400)


class ForbiddenException(AppException):
	def __init__(self, detail: str = "Không có quyền truy cập.") -> None:
		super().__init__(detail=detail, status_code=403)
