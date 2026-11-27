package com.logicflow.common;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    ResponseEntity<Map<String, Object>> negocio(BusinessException e) {
        return ResponseEntity.status(e.getStatus())
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> validacao(MethodArgumentNotValidException e) {
        List<Map<String, String>> erros = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(f -> Map.of(
                        "campo", f.getField(),
                        "mensagem", String.valueOf(f.getDefaultMessage())))
                .toList();

        return ResponseEntity.badRequest()
                .body(Map.of(
                        "message", "Dados inválidos.",
                        "errors", erros));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, Object>> corpoInvalido(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("message",
                        "Corpo da requisição inválido ou com valor não reconhecido."));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<Map<String, Object>> parametroInvalido(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("message",
                        "Parâmetro inválido: " + e.getName() + "."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, Object>> argumentoInvalido(IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Requisição inválida."));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Map<String, Object>> acessoNegado(AccessDeniedException e) {
        return ResponseEntity.status(403)
                .body(Map.of("message", "Acesso negado para o seu perfil."));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<Map<String, Object>> recursoNaoEncontrado(NoResourceFoundException e) {
        return ResponseEntity.status(404)
                .body(Map.of("message", "Recurso não encontrado."));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> erroInterno(Exception e) {
        log.error("Erro inesperado", e);

        return ResponseEntity.status(500)
                .body(Map.of("message", "Ocorreu um erro inesperado."));
    }
}