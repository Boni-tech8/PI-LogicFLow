package com.logicflow.security;

import com.logicflow.user.User;
import com.logicflow.user.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

// Não é @Component de propósito: é criado dentro do SecurityConfig para rodar só na cadeia do Spring Security
public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String ATTR_ERRO = "logicflow.auth.erro";

    private final JwtService jwtService;
    private final UserRepository users;

    public JwtAuthFilter(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || header.isBlank()) {
            chain.doFilter(request, response);
            return;
        }

        String[] partes = header.trim().split("\\s+");
        if (partes.length != 2 || !partes[0].equalsIgnoreCase("Bearer")) {
            request.setAttribute(ATTR_ERRO, "Formato do token inválido. Use: Authorization: Bearer <token>.");
            chain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtService.validar(partes[1]);
            Optional<User> user = users.findById(Long.valueOf(claims.getSubject()));

            if (user.isEmpty()) {
                request.setAttribute(ATTR_ERRO, "Token inválido.");
            } else if (user.get().isSuspenso()) {
                JsonErrors.escrever(response, 403, "Conta suspensa.");
                return;
            } else {
                User u = user.get();
                AuthUser principal = new AuthUser(u.getId(), u.getPerfil(), u.getNome());
                var autenticacao = new UsernamePasswordAuthenticationToken(
                        principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + u.getPerfil().name())));
                SecurityContextHolder.getContext().setAuthentication(autenticacao);
            }
        } catch (ExpiredJwtException e) {
            request.setAttribute(ATTR_ERRO, "Token expirado.");
        } catch (JwtException | IllegalArgumentException e) {
            request.setAttribute(ATTR_ERRO, "Token inválido.");
        }

        chain.doFilter(request, response);
    }
}