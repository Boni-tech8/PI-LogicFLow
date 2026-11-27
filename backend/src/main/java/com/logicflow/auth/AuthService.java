package com.logicflow.auth;

import com.logicflow.auth.AuthDtos.CadastroRequest;
import com.logicflow.auth.AuthDtos.LoginRequest;
import com.logicflow.auth.AuthDtos.TokenResponse;
import com.logicflow.auth.AuthDtos.UsuarioResponse;
import com.logicflow.common.BusinessException;
import com.logicflow.common.Telefone;
import com.logicflow.security.JwtService;
import com.logicflow.user.Role;
import com.logicflow.user.User;
import com.logicflow.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String MSG_DUPLICADO = "Número de telefone já cadastrado.";

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwtService) {
        this.users = users;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public TokenResponse cadastrar(CadastroRequest r) {
        if (r.tipoPerfil() == Role.ADMIN) {
            throw BusinessException.invalido("Perfil deve ser CONFECCAO ou FACCAO.");
        }
        String telefone = Telefone.normalizar(r.telefone());
        if (users.existsByTelefone(telefone)) {
            throw BusinessException.conflito(MSG_DUPLICADO);
        }
        User user;
        try {
            user = users.saveAndFlush(new User(r.nome().trim(), telefone, encoder.encode(r.senha()), r.tipoPerfil()));
        } catch (DataIntegrityViolationException e) {
            // duas requisições simultâneas com o mesmo telefone
            throw BusinessException.conflito(MSG_DUPLICADO);
        }
        return resposta(user);
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest r) {
        User user = users.findByTelefone(Telefone.normalizar(r.telefone()))
                .filter(u -> encoder.matches(r.senha(), u.getSenhaHash()))
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Telefone ou senha inválidos."));
        if (user.isSuspenso()) {
            throw BusinessException.proibido("Conta suspensa.");
        }
        return resposta(user);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse me(Long id) {
        return users.findById(id).map(UsuarioResponse::de)
                .orElseThrow(() -> BusinessException.naoEncontrado("Usuário não encontrado."));
    }

    private TokenResponse resposta(User user) {
        return new TokenResponse(jwtService.gerarToken(user), "Bearer",
                jwtService.getExpiracaoMinutos(), UsuarioResponse.de(user));
    }
}