package com.logicflow.acordo;

import com.logicflow.common.Telefone;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public final class WhatsAppLink {

    private static final String BASE = "https://wa.me/";

    private WhatsAppLink() {}

    public static String gerar(String telefone, Acordo acordo) {
        String digitos = Telefone.normalizar(telefone);
        // Telefone brasileiro com DDD tem 10 ou 11 dígitos; o wa.me exige o código do país
        if (digitos.length() <= 11) {
            digitos = "55" + digitos;
        }
        String mensagem = "Olá! Estou falando sobre o acordo #" + acordo.getId()
                + " (demanda #" + acordo.getDemanda().getId() + ") no LogicFlow.";
        String texto = URLEncoder.encode(mensagem, StandardCharsets.UTF_8).replace("+", "%20");
        return BASE + digitos + "?text=" + texto;
    }
}