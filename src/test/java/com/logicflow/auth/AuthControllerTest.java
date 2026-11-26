
package com.logicflow.auth;

import com.logicflow.auth.AuthDtos.LoginRequest;
import com.logicflow.auth.AuthDtos.TokenResponse;
import com.logicflow.auth.AuthDtos.UsuarioResponse;
import com.logicflow.common.BusinessException;
import com.logicflow.common.GlobalExceptionHandler;
import com.logicflow.user.Role;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest {

    private MockMvc mockMvc;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);

        mockMvc = MockMvcBuilders
                .standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void deveRetornar200QuandoLoginForValido() throws Exception {

        UsuarioResponse usuario = new UsuarioResponse(
                1L,
                "Usuario Teste",
                "81999999999",
                Role.CONFECCAO
        );

        TokenResponse resposta = new TokenResponse(
                "token-jwt-teste",
                "Bearer",
                60L,
                usuario
        );

        when(authService.login(any(LoginRequest.class)))
                .thenReturn(resposta);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                            "telefone": "81999999999",
                            "senha": "senha123"
                        }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-jwt-teste"))
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.usuario.id").value(1));

        verify(authService).login(
                new LoginRequest("81999999999", "senha123")
        );
    }

    @Test
    void deveRetornar401QuandoLoginForInvalido() throws Exception {

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BusinessException(
                        HttpStatus.UNAUTHORIZED,
                        "Telefone ou senha inválidos."
                ));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                            "telefone": "81999999999",
                            "senha": "senhaErrada"
                        }
                        """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message")
                        .value("Telefone ou senha inválidos."));

        verify(authService).login(
                new LoginRequest("81999999999", "senhaErrada")
        );
    }
}
