package com.logicflow.security;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public final class JsonErrors {

    private JsonErrors() {}

    public static void escrever(HttpServletResponse res, int status, String mensagem) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"message\":\"" + mensagem.replace("\"", "\\\"") + "\"}");
    }
}