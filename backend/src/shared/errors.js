// Errors with an HTTP status and a stable machine-readable code.
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

module.exports = { AppError }
