package com.logicflow.demanda;

import com.logicflow.LogicflowApplication;
import com.logicflow.common.GlobalExceptionHandler;
import com.logicflow.config.SecurityConfig;
import com.logicflow.demanda.DemandaDtos.DemandaRequest;
import com.logicflow.demanda.DemandaDtos.DemandaResponse;
import com.logicflow.security.AuthUser;
import com.logicflow.security.JwtService;
import com.logicflow.user.UserRepository;
import com.logicflow.user.Role;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DemandaController.class)
@ContextConfiguration(classes = LogicflowApplication.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
    "app.cors.origins=http://localhost:5173"
})
class DemandaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DemandaService demandaService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private UsernamePasswordAuthenticationToken autenticar(Role perfil) {

        AuthUser usuario = new AuthUser(
                1L,
                perfil,
                "Usuario Teste"
        );

        return new UsernamePasswordAuthenticationToken(
                usuario,
                null,
                List.of(
                    new SimpleGrantedAuthority(
                        "ROLE_" + perfil.name()
                    )
                )
        );
    }

    private String demandaValida() {
        return """
                {
                    "servico": "Costura de camisas",
                    "quantidade": 100,
                    "prazo": "%s",
                    "local": "Caruaru",
                    "descricao": "Demanda para teste"
                }
                """.formatted(LocalDate.now().plusDays(10));
    }

    @Test
    void deveRetornar201QuandoDemandaForCriada() throws Exception {

        DemandaResponse resposta = new DemandaResponse(
                1L,
                "Costura de camisas",
                100,
                LocalDate.now().plusDays(10),
                "Caruaru",
                "Demanda para teste",
                Demanda.Status.ABERTA,
                1L,
                "Usuario Teste",
                Instant.now()
        );

        when(demandaService.publicar(
                any(AuthUser.class),
                any(DemandaRequest.class)
        )).thenReturn(resposta);

        mockMvc.perform(post("/api/demandas")
                .with(authentication(autenticar(Role.CONFECCAO)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(demandaValida()))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.quantidade").value(100));
    }

    @Test
    void deveRetornar400QuandoDadosForemInvalidos() throws Exception {

        String jsonInvalido = """
                {
                    "servico": "",
                    "quantidade": 0,
                    "prazo": "%s",
                    "local": ""
                }
                """.formatted(LocalDate.now().plusDays(10));

        mockMvc.perform(post("/api/demandas")
                .with(authentication(autenticar(Role.CONFECCAO)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonInvalido))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(demandaService);
    }

    @Test
    void deveRetornar403QuandoPerfilNaoForPermitido() throws Exception {

        mockMvc.perform(post("/api/demandas")
                .with(authentication(autenticar(Role.FACCAO)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(demandaValida()))
                .andExpect(status().isForbidden());

        verifyNoInteractions(demandaService);
    }
}
