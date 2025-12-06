class ApiError extends Error {
  constructor(errorCode, errorMsg, field = null) {
    super(errorMsg);
    this.errorCode = errorCode;
    this.errorMsg = errorMsg;
    this.field = field;
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      success: false,
      data: {
        error_code: this.errorCode,
        error_msg: this.errorMsg,
        ...(this.field && { field: this.field }),
      },
    };
  }
}

module.exports = ApiError;

