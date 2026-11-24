package com.logicflow.common;

public final class Telefone {

    // Regex definida na issue de autenticação
    public static final String REGEX = "^[(]?[1-9]{2}[)]? ?(?:[2-8]|9[0-9])[0-9]{3}-?[0-9]{4}$";
    public static final String MENSAGEM = "Telefone inválido. Use o padrão brasileiro, ex.: (81) 98765-4321.";

    private Telefone() {}

    // Salva só os dígitos, para que "(81) 98765-4321" e "81987654321" sejam o mesmo número
    public static String normalizar(String telefone) {
        return telefone.replaceAll("\\D", "");
    }
}