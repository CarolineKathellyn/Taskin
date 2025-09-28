package com.server.taskin.exception;

public class TaskinException extends RuntimeException {

    private final String code;

    public TaskinException(String message) {
        super(message);
        this.code = "TASKIN_ERROR";
    }

    public TaskinException(String code, String message) {
        super(message);
        this.code = code;
    }

    public TaskinException(String message, Throwable cause) {
        super(message, cause);
        this.code = "TASKIN_ERROR";
    }

    public TaskinException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}