package com.logicflow.common;

import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static BusinessException invalido(String m) {
        return new BusinessException(HttpStatus.BAD_REQUEST, m);
    }

    public static BusinessException proibido(String m) {
        return new BusinessException(HttpStatus.FORBIDDEN, m);
    }

    public static BusinessException naoEncontrado(String m) {
        return new BusinessException(HttpStatus.NOT_FOUND, m);
    }

    public static BusinessException conflito(String m) {
        return new BusinessException(HttpStatus.CONFLICT, m);
    }
}