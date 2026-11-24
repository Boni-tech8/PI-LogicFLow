package com.logicflow.auth;

import com.logicflow.auth.AuthDtos.CadastroRequest;
import com.logicflow.auth.AuthDtos.LoginRequest;
import com.logicflow.auth.AuthDtos.TokenResponse;
import com.logicflow.auth.AuthDtos.UsuarioResponse;
import com.logicflow.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<TokenResponse> cadastro(@Valid @RequestBody CadastroRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.cadastrar(body));
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest body) {
        return service.login(body);
    }

    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal AuthUser user) {
        return service.me(user.id());
    }
}