package com.logicflow.auth;

import com.logicflow.common.Telefone;
import com.logicflow.user.Role;
import com.logicflow.user.User;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record CadastroRequest(
            @NotBlank(message = "Nome é obrigatório.")
            @Size(min = 2, max = 120, message = "Nome deve ter entre 2 e 120 caracteres.")
            String nome,

            @NotBlank(message = "Telefone é obrigatório.")
            @Pattern(regexp = Telefone.REGEX, message = Telefone.MENSAGEM)
            String telefone,

            @NotBlank(message = "Senha é obrigatória.")
            @Size(min = 6, max = 72, message = "A senha deve ter entre 6 e 72 caracteres.")
            String senha,

            @NotNull(message = "Perfil é obrigatório (CONFECCAO ou FACCAO).")
            Role tipoPerfil,

            @AssertTrue(message = "É necessário aceitar o termo de consentimento (LGPD).")
            boolean consentimentoLgpd) {}

    public record LoginRequest(
            @NotBlank(message = "Telefone é obrigatório.")
            @Pattern(regexp = Telefone.REGEX, message = Telefone.MENSAGEM)
            String telefone,

            @NotBlank(message = "Senha é obrigatória.")
            String senha) {}

    public record UsuarioResponse(Long id, String nome, String telefone, Role tipoPerfil) {
        public static UsuarioResponse de(User u) {
            return new UsuarioResponse(u.getId(), u.getNome(), u.getTelefone(), u.getPerfil());
        }
    }

    public record TokenResponse(String token, String tipo, long expiraEmMinutos, UsuarioResponse usuario) {}
}