package com.nexusflow.dto;

public class ErrorResponse {
    private ErrorDetails error;
    private String correlationId;

    public ErrorResponse() {}

    public ErrorResponse(String code, String message, String correlationId) {
        this.error = new ErrorDetails(code, message);
        this.correlationId = correlationId;
    }

    public ErrorDetails getError() { return error; }
    public void setError(ErrorDetails error) { this.error = error; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public static class ErrorDetails {
        private String code;
        private String message;

        public ErrorDetails() {}

        public ErrorDetails(String code, String message) {
            this.code = code;
            this.message = message;
        }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
