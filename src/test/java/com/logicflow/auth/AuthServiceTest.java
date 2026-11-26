
package com.logicflow.auth;

import com.logicflow.auth.AuthDtos.CadastroRequest;
import com.logicflow.auth.AuthDtos.LoginRequest;
import com.logicflow.auth.AuthDtos.TokenResponse;
import com.logicflow.common.BusinessException;
import com.logicflow.common.Telefone;
import com.logicflow.security.JwtService;
import com.logicflow.user.Role;
import com.logicflow.user.User;
import com.logicflow.user.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository users;
    private PasswordEncoder encoder;
    private JwtService jwtService;
    private AuthService authService;
    private User user;

    private final String telefone = "81999999999";
    private final String senha = "senha123";
    private final String senhaHash = "senhaCriptografada";

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        encoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);

        authService = new AuthService(
                users,
                encoder,
                jwtService
        );

        user = new User(
                "Usuario Teste",
                telefone,
                senhaHash,
                Role.CONFECCAO
        );
    }

    @Test
    void deveRetornarTokenQuandoLoginForValido() {

        when(users.findByTelefone(Telefone.normalizar(telefone)))
                .thenReturn(Optional.of(user));

        when(encoder.matches(senha, senhaHash))
                .thenReturn(true);

        when(jwtService.gerarToken(user))
                .thenReturn("token-jwt-teste");

        when(jwtService.getExpiracaoMinutos())
                .thenReturn(60L);

        TokenResponse resposta = authService.login(
                new LoginRequest(telefone, senha)
        );

        assertNotNull(resposta);
        assertEquals("token-jwt-teste", resposta.token());
        assertEquals("Bearer", resposta.tipo());
        assertEquals(60L, resposta.expiraEmMinutos());
        assertEquals(Role.CONFECCAO, resposta.usuario().tipoPerfil());

        verify(jwtService).gerarToken(user);
    }

    @Test
    void deveRetornar401QuandoSenhaForIncorreta() {

        when(users.findByTelefone(Telefone.normalizar(telefone)))
                .thenReturn(Optional.of(user));

        when(encoder.matches("senhaErrada", senhaHash))
                .thenReturn(false);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.login(
                        new LoginRequest(telefone, "senhaErrada")
                )
        );

        assertEquals(
                HttpStatus.UNAUTHORIZED,
                exception.getStatus()
        );

        verifyNoInteractions(jwtService);
    }

    @Test
    void deveRetornar401QuandoUsuarioNaoExistir() {

        when(users.findByTelefone(Telefone.normalizar(telefone)))
                .thenReturn(Optional.empty());

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.login(
                        new LoginRequest(telefone, senha)
                )
        );

        assertEquals(
                HttpStatus.UNAUTHORIZED,
                exception.getStatus()
        );

        verifyNoInteractions(encoder, jwtService);
    }

    @Test
    void deveRetornar403QuandoContaEstiverSuspensa() {

        user.setSuspenso(true);

        when(users.findByTelefone(Telefone.normalizar(telefone)))
                .thenReturn(Optional.of(user));

        when(encoder.matches(senha, senhaHash))
                .thenReturn(true);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.login(
                        new LoginRequest(telefone, senha)
                )
        );

        assertEquals(
                HttpStatus.FORBIDDEN,
                exception.getStatus()
        );

        verifyNoInteractions(jwtService);
    }

    @Test
    void deveRetornar409QuandoTelefoneJaEstiverCadastrado() {

        when(users.existsByTelefone(Telefone.normalizar(telefone)))
                .thenReturn(true);

        CadastroRequest request = new CadastroRequest(
                "Usuario Teste",
                telefone,
                senha,
                Role.CONFECCAO,
                true
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.cadastrar(request)
        );

        assertEquals(
                HttpStatus.CONFLICT,
                exception.getStatus()
        );

        verify(users, never()).saveAndFlush(any(User.class));
        verifyNoInteractions(encoder, jwtService);
    }
}
