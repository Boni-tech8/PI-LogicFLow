package com.logicflow.common;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    ResponseEntity<Map<String, Object>> negocio(BusinessException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> validacao(MethodArgumentNotValidException e) {
        List<Map<String, String>> erros = e.getBindingResult().getFieldErrors().stream()
                .map(f -> Map.of("campo", f.getField(), "mensagem", String.valueOf(f.getDefaultMessage())))
                .toList();
        return ResponseEntity.badRequest().body(Map.of("message", "Dados inválidos.", "errors", erros));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, Object>> corpoInvalido(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(Map.of("message", "Corpo da requisição inválido ou com valor não reconhecido."));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<Map<String, Object>> parametroInvalido(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest().body(Map.of("message", "Parâmetro inválido: " + e.getName() + "."));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Map<String, Object>> acessoNegado(AccessDeniedException e) {
        return ResponseEntity.status(403).body(Map.of("message", "Acesso negado para o seu perfil."));
    }
}